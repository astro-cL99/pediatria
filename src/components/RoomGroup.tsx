import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Bed, Stethoscope, Thermometer, HeartPulse, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BedAssignment } from "@/types/bed-assignment";
import { calculatePediatricAge } from "@/utils/calculatePediatricAge";

// Extend the BedAssignment type to include additional properties
interface ExtendedBedAssignment {
  id: string;
  patient_id: string;
  admission_id: string;
  assigned_at: string;
  room_number: string;
  bed_number: number | string;
  service?: 'pediatria' | 'ucip' | 'cirugia';
  patient: {
    id: string;
    name: string;
    rut: string;
    date_of_birth: string;
    allergies?: string | null;
    status?: 'estable' | 'inestable' | 'crítico' | 'active' | 'deceased' | 'discharged' | 'transferred';
  };
  admission?: {
    id: string;
    admission_date: string;
    admission_diagnoses?: string[];
    oxygen_requirement?: any;
    respiratory_score?: string | null;
    viral_panel?: string | null;
    pending_tasks?: string | null;
    antibiotics?: any;
    medications?: string;
  };
}

interface RoomGroupProps {
  roomNumber: string;
  service: 'pediatria' | 'ucip' | 'cirugia';
  patients: ExtendedBedAssignment[];
  onPatientClick: (patientId: string) => void;
  onAssignBed: (roomNumber: string, bedNumber: string) => void;
  defaultExpanded?: boolean;
}

// Generate all possible beds (always 3 beds per room)
const generateAllBeds = (roomNumber: string): string[] => {
  return Array.from({ length: 3 }, (_, i) => (i + 1).toString());
};

// Format days hospitalized

// Format days hospitalized
const formatDaysHospitalized = (days: number): string => {
  if (days === 0) return 'Hoy';
  if (days === 1) return '1 día';
  return `${days} días`;
};

// Service type mapping with colors and icons
const serviceConfig = {
  pediatria: {
    name: 'Pediatría',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <HeartPulse className="w-4 h-4 mr-2" />
  },
  ucip: {
    name: 'UCIP',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-800 dark:text-rose-200',
    border: 'border-rose-200 dark:border-rose-800',
    icon: <Thermometer className="w-4 h-4 mr-2" />
  },
  cirugia: {
    name: 'Cirugía',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-800',
    icon: <Stethoscope className="w-4 h-4 mr-2" />
  }
} as const;

export function RoomGroup({ 
  roomNumber, 
  service, 
  patients, 
  onPatientClick,
  onAssignBed,
  defaultExpanded = true 
}: RoomGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const config = serviceConfig[service] || serviceConfig.pediatria;
  const allBeds = generateAllBeds(roomNumber);
  const occupiedBeds = patients.map(p => p.bed_number?.toString() || '');
  const occupancyPercentage = Math.round((occupiedBeds.filter(Boolean).length / allBeds.length) * 100);
  
  // Calculate status counts for the room summary
  const statusCounts = patients.reduce((acc, curr) => {
    const status = curr.patient.status || 'sin_estado';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get patient by bed number
  const getPatientInBed = (bedNumber: string): ExtendedBedAssignment | undefined => {
    return patients.find(p => p.bed_number?.toString() === bedNumber);
  };

  // Render a single bed card
  const renderBedCard = (bedNumber: string) => {
    const bedAssignment = getPatientInBed(bedNumber);
    const isOccupied = !!bedAssignment;
    const patient = bedAssignment?.patient;

    if (isOccupied && patient) {
      const admissionDate = new Date(bedAssignment.admission?.admission_date || new Date());
      const daysHospitalized = Math.floor(
        (currentTime.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const statusMap = {
        estable: 'bg-green-500',
        inestable: 'bg-yellow-500',
        crítico: 'bg-red-500',
      } as const;
      
      const statusColor = statusMap[patient.status || 'estable'] || 'bg-gray-400';
      const age = patient.date_of_birth ? calculatePediatricAge(patient.date_of_birth) : 'N/A';

      return (
        <div
          key={`${roomNumber}-${bedNumber}`}
          className={cn(
            "border rounded-lg p-3 hover:shadow-md transition-all cursor-pointer h-full flex flex-col",
            config.border,
            "hover:ring-1 hover:ring-offset-1"
          )}
          onClick={() => patient?.id && onPatientClick(patient.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <div className={cn("w-2 h-2 rounded-full mr-2 flex-shrink-0", statusColor)} />
              <span className="font-medium truncate max-w-[180px]">{patient.name}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {formatDaysHospitalized(daysHospitalized)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm mt-1">
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">Edad:</span>
              <span>{age}</span>
            </div>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">RUT:</span>
              <span className="font-mono text-xs">{patient.rut || 'N/A'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-muted">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Cama {bedNumber}</span>
              {patient.allergies && (
                <Badge variant="destructive" className="text-xs">
                  Alergias
                </Badge>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Available bed - mantener las mismas proporciones que las camas ocupadas
    return (
      <div
        key={`available-${roomNumber}-${bedNumber}`}
        className={cn(
          "border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center",
          "hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full",
          config.border,
          "min-h-[140px]"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onAssignBed(roomNumber, bedNumber);
        }}
      >
        <div className="flex flex-col items-center justify-center gap-2 flex-1">
          <div className="rounded-full border-2 border-dashed border-muted-foreground/50 p-2">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-sm text-muted-foreground font-medium">Cama {bedNumber}</span>
          <span className="text-xs text-muted-foreground/70">Disponible</span>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden mb-4 transition-all shadow-sm w-full", config.border)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 text-left flex items-center justify-between",
          "hover:bg-muted/20 transition-colors",
          config.bg,
          config.text,
          isExpanded ? 'border-b' : ''
        )}
      >
        <div className="flex items-center">
          <div className="flex items-center">
            {config.icon}
            <h3 className="font-semibold ml-2">Sala {roomNumber}</h3>
          </div>
          <div className="ml-4 flex items-center">
            <div className="w-24 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mr-2">
              <div 
                className={cn("h-2.5 rounded-full", {
                  'bg-green-500': occupancyPercentage < 60,
                  'bg-yellow-500': occupancyPercentage >= 60 && occupancyPercentage < 90,
                  'bg-red-500': occupancyPercentage >= 90
                })}
                style={{ width: `${Math.max(5, occupancyPercentage)}%` }}
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {patients.length}/{allBeds.length} camas
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium mr-3">
            {config.name}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="bg-background w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 w-full">
            {allBeds.map(bedNumber => (
              <div key={bedNumber} className="w-full">
                {renderBedCard(bedNumber)}
              </div>
            ))}
          </div>
          
          {/* Room Summary */}
          <div className={cn("px-4 py-2 text-xs flex flex-wrap justify-between items-center border-t gap-2", config.border)}>
            <div className="flex items-center">
              <span className="text-muted-foreground mr-1">Ocupación:</span>
              <span className="font-medium">{occupancyPercentage}%</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {patients.some(p => p.patient.allergies) && (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-1 bg-red-500" />
                  <span className="text-muted-foreground text-xs">
                    {patients.filter(p => p.patient.allergies).length} con alergias
                  </span>
                </div>
              )}
              
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center">
                  <div className={cn("w-2 h-2 rounded-full mr-1", {
                    'bg-green-500': status === 'estable',
                    'bg-yellow-500': status === 'inestable',
                    'bg-red-500': status === 'crítico',
                    'bg-gray-400': !status || status === 'sin_estado'
                  })} />
                  <span className="text-muted-foreground text-xs">
                    {count} {status === 'sin_estado' ? 'sin estado' : status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}