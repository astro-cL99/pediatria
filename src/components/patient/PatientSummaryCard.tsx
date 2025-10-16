import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail, MapPin, HeartPulse, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PatientSummaryCardProps {
  patient: {
    id: string;
    fullName: string;
    birthDate: string;
    age: number;
    gender: string;
    photoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
    bloodType?: string;
    allergies?: string[];
    insurance?: {
      provider: string;
      policyNumber: string;
      expiryDate?: string;
    };
  };
  onEdit?: () => void;
  className?: string;
}

const PatientSummaryCard: React.FC<PatientSummaryCardProps> = ({
  patient,
  onEdit,
  className = '',
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {patient.photoUrl ? (
                <AvatarImage src={patient.photoUrl} alt={patient.fullName} />
              ) : (
                <AvatarFallback className="text-lg">
                  {getInitials(patient.fullName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-xl">{patient.fullName}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-4 w-4" />
                <span>
                  {new Date(patient.birthDate).toLocaleDateString()} • {patient.age} años •{' '}
                  {patient.gender === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              </div>
            </div>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información de contacto */}
        {(patient.phone || patient.email || patient.address) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Información de contacto</h4>
            <div className="space-y-1 text-sm">
              {patient.phone && (
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${patient.phone}`} className="hover:underline">
                    {patient.phone}
                  </a>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${patient.email}`} className="hover:underline">
                    {patient.email}
                  </a>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{patient.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Información médica */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Información médica</h4>
          <div className="space-y-1 text-sm">
            {patient.bloodType && (
              <div className="flex items-center">
                <HeartPulse className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Tipo de sangre: {patient.bloodType}</span>
              </div>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="flex items-start">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block mb-1">Alergias:</span>
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy) => (
                      <Badge key={allergy} variant="outline" className="text-xs">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seguro médico */}
        {patient.insurance && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Seguro médico</h4>
            <div className="p-3 bg-muted/30 rounded-md">
              <div className="font-medium">{patient.insurance.provider}</div>
              <div className="text-sm text-muted-foreground">
                Póliza: {patient.insurance.policyNumber}
              </div>
              {patient.insurance.expiryDate && (
                <div className="text-xs text-muted-foreground mt-1">
                  Vence: {new Date(patient.insurance.expiryDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientSummaryCard;
