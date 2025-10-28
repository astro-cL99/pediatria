import { useState, useEffect, useMemo } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomGroup } from "@/components/RoomGroup";
import { BedAssignmentDialog } from "@/components/BedAssignmentDialog";
import { 
  Search, 
  Plus, 
  UserPlus, 
  Clock, 
  Wind, 
  Users, 
  Syringe,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

// Definición completa de salas 501-512 (507 solo tiene 1 cama)
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

const TOTAL_BEDS = ALL_PEDIATRIA_ROOMS.reduce((sum, room) => sum + room.beds, 0); // 34 camas

interface BedAssignment {
  id: string;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  room_number: string;
  bed_number: number;
  service?: 'pediatria' | 'cirugia' | 'ucip';
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
    allergies: string | null;
    status?: 'estable' | 'inestable' | 'crítico' | 'active' | 'deceased' | 'discharged' | 'transferred';
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
  };
}

export default function Patients() {
  const navigate = useNavigate();
  const [bedAssignments, setBedAssignments] = useState<BedAssignment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<'pediatria'>('pediatria');
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{ room: string; bed: string }>({ room: "", bed: "" });

  useEffect(() => {
    fetchBedAssignments();

    const channel = supabase
      .channel('patients-bed-assignments')
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
      
      const mappedData = (data || []).map(item => ({
        ...item,
        service: 'pediatria' as const
      }));
      
      setBedAssignments(mappedData);
    } catch (error) {
      console.error("Error fetching bed assignments:", error);
      toast.error("Error al cargar pacientes hospitalizados");
    } finally {
      setLoading(false);
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

  const filteredPatients = useMemo(() => {
    return bedAssignments.filter((bed) => {
      const matchesSearch = 
        bed.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.patient.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.room_number.includes(searchTerm);

      const matchesService = bed.room_number.startsWith("50");

      return matchesSearch && matchesService;
    });
  }, [bedAssignments, searchTerm]);

  // Agrupar pacientes por sala
  const roomGroups = useMemo(() => {
    const groups: { [key: string]: BedAssignment[] } = {};
    
    // Inicializar TODAS las salas (incluso vacías)
    ALL_PEDIATRIA_ROOMS.forEach(room => {
      groups[room.number] = [];
    });

    // Agregar pacientes a sus salas correspondientes
    filteredPatients.forEach(patient => {
      if (groups[patient.room_number]) {
        groups[patient.room_number].push(patient);
      }
    });
    
    return groups;
  }, [filteredPatients]);

  // Estadísticas
  const stats = useMemo(() => {
    const occupied = bedAssignments.filter(b => b.room_number.startsWith("50")).length;
    const occupancyRate = Math.round((occupied / TOTAL_BEDS) * 100);
    
    return {
      total: occupied,
      capacity: TOTAL_BEDS,
      occupancyRate,
      withO2: filteredPatients.filter(b => b.admission.oxygen_requirement && Object.keys(b.admission.oxygen_requirement).length > 0).length,
      withATB: filteredPatients.filter(b => b.admission.antibiotics && b.admission.antibiotics.length > 0).length,
      withPending: filteredPatients.filter(b => b.admission.pending_tasks && b.admission.pending_tasks.trim().length > 0).length,
      avgDays: filteredPatients.length > 0 
        ? Math.round(filteredPatients.reduce((sum, b) => sum + getDaysHospitalized(b.admission.admission_date), 0) / filteredPatients.length)
        : 0,
    };
  }, [bedAssignments, filteredPatients]);

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gestión de Camas - Pediatría
          </h1>
          <p className="text-muted-foreground mt-1">
            Salas 501-512 • Ocupación: {stats.total}/{stats.capacity} camas ({stats.occupancyRate}%)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admission/new")} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Ingreso
          </Button>
          <Button onClick={() => navigate("/patient/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ocupación</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">{stats.total}/{stats.capacity} camas</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pacientes</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.total}</div>
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
            <div className="text-3xl font-bold text-red-600">{stats.withO2}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Con Antibióticos</CardTitle>
              <Syringe className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.withATB}</div>
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
            <div className="text-3xl font-bold text-purple-600">{stats.avgDays}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
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
        </div>
      </Card>

      {/* Rooms Display */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">Cargando salas...</div>
        ) : (
          <>
            {ALL_PEDIATRIA_ROOMS.map((room) => (
              <RoomGroup
                key={room.number}
                roomNumber={room.number}
                service="pediatria"
                patients={roomGroups[room.number] || []}
                onPatientClick={handlePatientClick}
                onAssignBed={handleAssignBed}
                defaultExpanded={false}
              />
            ))}
          </>
        )}
      </div>

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
