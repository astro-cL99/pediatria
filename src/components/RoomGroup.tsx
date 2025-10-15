import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Bed, Stethoscope, Thermometer, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BedAssignment } from "@/types/bed-assignment";

// Extend the BedAssignment type to include additional properties
interface ExtendedBedAssignment extends Omit<BedAssignment, 'patient' | 'admission'> {
  patient: BedAssignment['patient'] & {
    status?: 'estable' | 'inestable' | 'crítico';
  };
  admission?: BedAssignment['admission'] & {
    admission_date: string;
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

// Generate all possible beds (1-3 for rooms 501-512, and 1 for room 7)
const generateAllBeds = (roomNumber: string): string[] => {
  const bedCount = roomNumber === '7' ? 1 : 3;
  return Array.from({ length: bedCount }, (_, i) => (i + 1).toString());
};

// Calculate patient age from date of birth
const calculateAge = (dob: string): string => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age > 1 ? `${age} años` : 'Menos de 1 año';
};

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
      const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : 'N/A';

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

    // Available bed
    return (
      <div
        key={`available-${roomNumber}-${bedNumber}`}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center",
          "hover:border-primary/30 transition-colors min-h-[120px]",
          config.border.replace('border-', 'border-')
        )}
      >
        <Bed className="w-5 h-5 mb-2 text-muted-foreground" />
        <span className="text-sm text-muted-foreground mb-3">Cama {bedNumber}</span>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs h-7"
          onClick={(e) => {
            e.stopPropagation();
            onAssignBed(roomNumber, bedNumber);
          }}
        >
          Asignar Paciente
        </Button>
      </div>
    );
  };

              {patients.some(p => p.patient.allergies) && (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full mr-1 bg-red-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
