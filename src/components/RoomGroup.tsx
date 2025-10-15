import { useState } from "react";
import { ChevronDown, ChevronRight, Bed, Users, Wind, Syringe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BedAssignment } from "@/types/bed-assignment";

interface RoomGroupProps {
  roomNumber: string;
  service: string;
  patients: BedAssignment[];
  onPatientClick: (patientId: string) => void;
  defaultExpanded?: boolean;
}

export function RoomGroup({ 
  roomNumber, 
  service, 
  patients, 
  onPatientClick,
  defaultExpanded = true 
}: RoomGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const serviceColors = {
    pediatria: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    cirugia: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    ucip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };

  if (patients.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 text-left flex items-center justify-between",
          "hover:bg-muted/50 transition-colors",
          serviceColors[service as keyof typeof serviceColors],
          isExpanded ? 'border-b' : ''
        )}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-2" />
            <span className="font-medium">Habitación {roomNumber}</span>
            <span className="mx-2">•</span>
            <span className="capitalize">{service}</span>
          </div>
          <Badge variant="secondary" className="ml-2">
            {patients.length} {patients.length === 1 ? 'paciente' : 'pacientes'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {patients.filter(p => p.admission.oxygen_requirement?.type).length} con O₂ • {
            patients.filter(p => p.admission.antibiotics?.length > 0).length} con ATB
          </span>
        </div>
      </button>
      
      {isExpanded && (
        <div className="bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {patients.map((bedAssignment) => (
              <div 
                key={bedAssignment.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onPatientClick(bedAssignment.patient_id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{bedAssignment.patient.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Cama {bedAssignment.bed_number} • {bedAssignment.patient.rut}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    {bedAssignment.admission.oxygen_requirement?.type && (
                      <span className="text-amber-600">
                        <Wind className="h-4 w-4" />
                      </span>
                    )}
                    {bedAssignment.admission.antibiotics?.length > 0 && (
                      <span className="text-rose-600">
                        <Syringe className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </div>
                {bedAssignment.admission.admission_diagnoses?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">
                      {bedAssignment.admission.admission_diagnoses[0]}
                      {bedAssignment.admission.admission_diagnoses.length > 1 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
