import { useState } from "react";
import { ChevronDown, ChevronRight, Bed, Users, Wind, Syringe, User } from "lucide-react";
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

// Generate all possible beds (1-3 for rooms 501-512, and 1 for room 7)
const generateAllBeds = (roomNumber: string) => {
  const bedCount = roomNumber === '7' ? 1 : 3;
  return Array.from({ length: bedCount }, (_, i) => (i + 1).toString());
};

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

  const allBeds = generateAllBeds(roomNumber);
  const occupiedBeds = patients.map(p => p.bed_number.toString());
  const availableBeds = allBeds.filter(bed => !occupiedBeds.includes(bed));

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
            {patients.length} de {allBeds.length} camas ocupadas
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
            {/* Show occupied beds first */}
            {patients.map((bedAssignment) => {
              const bedNumber = bedAssignment.bed_number.toString();
              return (
                <div 
                  key={`occupied-${bedNumber}`}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => onPatientClick(bedAssignment.patient_id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          {bedAssignment.patient.name}
                        </h4>
                        <div className="flex space-x-1">
                          {bedAssignment.admission.oxygen_requirement?.type && (
                            <span className="text-amber-600" title="Requiere oxígeno">
                              <Wind className="h-4 w-4" />
                            </span>
                          )}
                          {bedAssignment.admission.antibiotics?.length > 0 && (
                            <span className="text-rose-600" title="En tratamiento antibiótico">
                              <Syringe className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Cama {bedNumber}</span> • {bedAssignment.patient.rut}
                      {bedAssignment.admission.admission_diagnoses?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {bedAssignment.admission.admission_diagnoses[0]}
                      {bedAssignment.admission.admission_diagnoses.length > 1 ? '...' : ''}
                    </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show available beds */}
            {availableBeds.map(bedNumber => (
              <div 
                key={`available-${bedNumber}`}
                className="border-2 border-dashed rounded-lg p-3 bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-muted-foreground">Cama {bedNumber}</div>
                    <p className="text-xs text-muted-foreground mt-1">Disponible</p>
                  </div>
                  <Bed className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Room occupancy stats */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ocupación: {Math.round((patients.length / allBeds.length) * 100)}%</span>
              <span>{patients.length} de {allBeds.length} camas ocupadas</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(patients.length / allBeds.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

