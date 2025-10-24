import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Clock, 
  Wind, 
  Users, 
  Syringe,
  Download,
  Upload,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { calculatePediatricAge } from "@/utils/calculatePediatricAge";

// Components
import { HandoverStats } from "@/components/HandoverStats";
import { BedCard } from "@/components/BedCard";
import { HandoverListView } from "@/components/HandoverListView";
import { RoomGroup } from "@/components/RoomGroup";
import { BedAssignmentDialog } from "@/components/BedAssignmentDialog";
import { ImportHandoverButton } from "@/components/ImportHandoverButton";
import { exportHandoverToExcel } from "@/utils/exportHandover";

// Constants
const ALL_PEDIATRIA_ROOMS = [
  { number: '501', beds: 3 },
  { number: '502', beds: 3 },
  { number: '503', beds: 3 },
  { number: '504', beds: 3 },
  { number: '505', beds: 3 },
  { number: '506', beds: 3 },
  { number: '507', beds: 3 },
  { number: '508', beds: 3 },
  { number: '509', beds: 3 },
  { number: '510', beds: 3 },
  { number: '511', beds: 3 },
  { number: '512', beds: 3 },
];

const TOTAL_BEDS = ALL_PEDIATRIA_ROOMS.reduce((sum, room) => sum + room.beds, 0);

interface BedAssignment {
  id: string;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  room_number: string;
  bed_number: number;
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

export default function PatientsUnified() {
  const navigate = useNavigate();
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState<"pediatria" | "cirugia">("pediatria");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "detailed">("grid");
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{ room: string; bed: string }>({ room: "", bed: "" });

  useEffect(() => {
    fetchBedAssignments();

    const channel = supabase
      .channel('patients-unified-changes')
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
      toast.error("Error al cargar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const handleExportHandover = async () => {
    try {
      await exportHandoverToExcel(bedAssignments);
      toast.success("Datos exportados exitosamente");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error al exportar datos");
    }
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleAssignBed = (roomNumber: string, bedNumber: string) => {
    setSelectedBed({ room: roomNumber, bed: bedNumber });
    setAssignmentDialogOpen(true);
  };

  const getDaysHospitalized = (admissionDate: string) => {
    return differenceInDays(new Date(), new Date(admissionDate));
  };

  const getRoomsForService = (service: "pediatria" | "cirugia") => {
    return service === "pediatria" 
      ? ALL_PEDIATRIA_ROOMS.map(r => r.number)
      : Array.from({ length: 12 }, (_, i) => `60${i + 1}`);
  };

  const getBedsForRoom = (roomNumber: string) => {
    return bedAssignments.filter(
      (assignment) => assignment.room_number === roomNumber
    );
  };

  const filteredBeds = useMemo(() => {
    return bedAssignments.filter((bed) => {
      const matchesSearch = 
        bed.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.patient.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.room_number.includes(searchTerm);
      
      const matchesService = activeService === "pediatria" 
        ? bed.room_number.startsWith("50")
        : bed.room_number.startsWith("60");

      return matchesSearch && matchesService;
    });
  }, [bedAssignments, searchTerm, activeService]);

  // Agrupar pacientes por sala para vista detallada
  const roomGroups = useMemo(() => {
    const groups: { [key: string]: BedAssignment[] } = {};
    
    ALL_PEDIATRIA_ROOMS.forEach(room => {
      groups[room.number] = [];
    });

    filteredBeds.forEach(patient => {
      if (groups[patient.room_number]) {
        groups[patient.room_number].push(patient);
      }
    });
    
    return groups;
  }, [filteredBeds]);

  const stats = useMemo(() => {
    const servicePrefix = activeService === "pediatria" ? "50" : "60";
    const serviceBeds = bedAssignments.filter(b => b.room_number.startsWith(servicePrefix));
    const capacity = activeService === "pediatria" ? TOTAL_BEDS : 36; // Asumiendo 36 camas para cirugía
    const occupied = serviceBeds.length;
    const occupancyRate = Math.round((occupied / capacity) * 100);
    
    return {
      total: occupied,
      capacity,
      occupancyRate,
      withO2: filteredBeds.filter(b => b.admission.oxygen_requirement && Object.keys(b.admission.oxygen_requirement).length > 0).length,
      withATB: filteredBeds.filter(b => b.admission.antibiotics && Array.isArray(b.admission.antibiotics) && b.admission.antibiotics.length > 0).length,
      withPending: filteredBeds.filter(b => b.admission.pending_tasks && b.admission.pending_tasks.trim().length > 0).length,
      withViralPanel: filteredBeds.filter(b => b.admission.viral_panel && b.admission.viral_panel.trim().length > 0).length,
      avgDays: filteredBeds.length > 0 
        ? Math.round(filteredBeds.reduce((sum, b) => sum + getDaysHospitalized(b.admission.admission_date), 0) / filteredBeds.length)
        : 0,
    };
  }, [bedAssignments, filteredBeds, activeService]);

  const rooms = getRoomsForService(activeService);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🏥 Gestión de Pacientes Hospitalizados
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeService === "pediatria" ? "Salas 501-512" : "Salas 601-612"} • Ocupación: {stats.total}/{stats.capacity} camas ({stats.occupancyRate}%)
          </p>
        </div>
        <div className="flex gap-2">
          <ImportHandoverButton onImportComplete={fetchBedAssignments} />
          <Button variant="outline" onClick={handleExportHandover}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => navigate("/admission/new")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </Button>
          <Button onClick={() => navigate("/patient/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Estadísticas Visuales */}
      <HandoverStats bedAssignments={filteredBeds} />

      {/* Estadísticas Detalladas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ocupación</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.total}/{stats.capacity} camas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Con O₂</CardTitle>
              <Wind className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.withO2}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Antibióticos</CardTitle>
              <Syringe className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.withATB}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Panel Respiratorio</CardTitle>
              <Wind className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.withViralPanel}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.withPending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Días</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.avgDays}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and View Controls */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por paciente, RUT o número de sala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="grid">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Cuadrícula
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-2" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="detailed">
                <Users className="h-4 w-4 mr-2" />
                Detallada
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Service Tabs */}
      <Tabs value={activeService} onValueChange={(v) => setActiveService(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pediatria">Pediatría (501-512)</TabsTrigger>
          <TabsTrigger value="cirugia">Cirugía Infantil (601-612)</TabsTrigger>
        </TabsList>

        <TabsContent value={activeService} className="mt-6">
          {loading ? (
            <div className="text-center py-12">Cargando pacientes...</div>
          ) : viewMode === "list" ? (
            <HandoverListView beds={filteredBeds} onUpdate={fetchBedAssignments} />
          ) : viewMode === "detailed" ? (
            <div className="space-y-4">
              {rooms.map((roomNumber) => (
                <RoomGroup
                  key={roomNumber}
                  roomNumber={roomNumber}
                  service={activeService}
                  patients={roomGroups[roomNumber] || []}
                  onPatientClick={handlePatientClick}
                  onAssignBed={handleAssignBed}
                  defaultExpanded={false}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
              {rooms.map((roomNumber) => {
                const bedsInRoom = searchTerm 
                  ? filteredBeds.filter(b => b.room_number === roomNumber)
                  : getBedsForRoom(roomNumber);
                
                // Buscar el total de camas para esta habitación
                const roomConfig = ALL_PEDIATRIA_ROOMS.find(r => r.number === roomNumber);
                const totalBedsInRoom = roomConfig ? roomConfig.beds : 3;
                
                return (
                  <div key={roomNumber} className="relative">
                    <BedCard
                      roomNumber={roomNumber}
                      beds={bedsInRoom}
                      onUpdate={fetchBedAssignments}
                    />
                    {bedsInRoom.length < totalBedsInRoom && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute bottom-2 right-2 h-7 z-10"
                        onClick={() => handleAssignBed(roomNumber, (bedsInRoom.length + 1).toString())}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Leyenda de Colores y Estados</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Requiere O₂ / CPAP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Antibióticos activos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span>Panel respiratorio positivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span>Sueroterapia EV</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Alimentación oral</span>
          </div>
        </div>
        
        <h3 className="font-semibold mt-4 mb-3">Tipos de Alimentación</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><strong>NPO:</strong> Régimen cero</div>
          <div><strong>Común:</strong> Régimen común</div>
          <div><strong>Liviano:</strong> Régimen liviano</div>
          <div><strong>APLV:</strong> Sin proteínas leche vaca</div>
        </div>
      </Card>

      {/* Bed Assignment Dialog */}
      <BedAssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        roomNumber={selectedBed.room}
        bedNumber={selectedBed.bed}
        onAssignmentComplete={() => {
          fetchBedAssignments();
        }}
      />
    </div>
  );
}
