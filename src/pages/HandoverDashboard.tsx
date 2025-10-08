import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HandoverStats } from "@/components/HandoverStats";
import { BedCard } from "@/components/BedCard";
import { ImportHandoverButton } from "@/components/ImportHandoverButton";
import { exportHandoverToExcel } from "@/utils/exportHandover";
import { toast } from "sonner";

interface BedAssignment {
  id: string;
  room_number: string;
  bed_number: number;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
    allergies: string | null;
  };
  admission: {
    id: string;
    admission_date: string;
    admission_diagnoses: string[];
    oxygen_requirement: any;
    respiratory_score: string | null;
    viral_panel: string | null;
    pending_tasks: string | null;
    antibiotics: any;
    medications: any;
  };
}

export default function HandoverDashboard() {
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState<"pediatria" | "cirugia">("pediatria");

  useEffect(() => {
    fetchBedAssignments();

    const channel = supabase
      .channel('bed-assignments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bed_assignments' },
        () => fetchBedAssignments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBedAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("bed_assignments")
        .select(`
          *,
          patient:patients(*),
          admission:admissions(*)
        `)
        .eq("is_active", true)
        .order("room_number")
        .order("bed_number");

      if (error) throw error;
      setBedAssignments(data || []);
    } catch (error) {
      console.error("Error fetching bed assignments:", error);
      toast.error("Error al cargar asignaciones de camas");
    } finally {
      setLoading(false);
    }
  };

  const handleExportHandover = async () => {
    try {
      await exportHandoverToExcel(bedAssignments);
      toast.success("Entrega de turno exportada exitosamente");
    } catch (error) {
      console.error("Error exporting handover:", error);
      toast.error("Error al exportar entrega de turno");
    }
  };

  const getRoomsForService = (service: "pediatria" | "cirugia") => {
    const rooms = service === "pediatria" 
      ? Array.from({ length: 12 }, (_, i) => `50${i + 1}`)
      : Array.from({ length: 12 }, (_, i) => `60${i + 1}`);
    return rooms;
  };

  const getBedsForRoom = (roomNumber: string) => {
    return bedAssignments.filter(
      (assignment) => assignment.room_number === roomNumber
    );
  };

  const filteredBeds = bedAssignments.filter((bed) => {
    const matchesSearch = 
      bed.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.patient.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bed.room_number.includes(searchTerm);
    
    const matchesService = activeService === "pediatria" 
      ? bed.room_number.startsWith("50")
      : bed.room_number.startsWith("60");

    return matchesSearch && matchesService;
  });

  const rooms = getRoomsForService(activeService);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entrega de Turno</h1>
          <p className="text-muted-foreground">
            Visualización de camas y pacientes hospitalizados
          </p>
        </div>
        <div className="flex gap-2">
          <ImportHandoverButton onImportComplete={fetchBedAssignments} />
          <Button onClick={handleExportHandover}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      <HandoverStats bedAssignments={bedAssignments} />

      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por paciente, RUT o número de cama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeService} onValueChange={(v) => setActiveService(v as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pediatria">Pediatría (501-512)</TabsTrigger>
            <TabsTrigger value="cirugia">Cirugía Infantil (601-612)</TabsTrigger>
          </TabsList>

          <TabsContent value={activeService} className="mt-6">
            {loading ? (
              <div className="text-center py-12">Cargando camas...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {rooms.map((roomNumber) => {
                  const beds = searchTerm 
                    ? filteredBeds.filter(b => b.room_number === roomNumber)
                    : getBedsForRoom(roomNumber);
                  
                  return (
                    <BedCard
                      key={roomNumber}
                      roomNumber={roomNumber}
                      beds={beds}
                      onUpdate={fetchBedAssignments}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Requiere O2 / CPAP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Antibióticos activos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Panel viral positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Estable</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
