import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Calendar, Plus } from 'lucide-react';

type Appointment = {
  id: string;
  patient: string;
  time: string;
  type: string;
  doctor: string;
  isNew?: boolean;
};

const appointments: Appointment[] = [
  {
    id: '1',
    patient: 'Sofía Martínez',
    time: '10:00 AM',
    type: 'Control pediátrico',
    doctor: 'Dr. Juan Pérez',
  },
  {
    id: '2',
    patient: 'Mateo Rodríguez',
    time: '11:30 AM',
    type: 'Vacunación',
    doctor: 'Dra. Ana López',
  },
  {
    id: '3',
    patient: 'Valentina González',
    time: '2:15 PM',
    type: 'Consulta general',
    doctor: 'Dr. Carlos Rojas',
    isNew: true,
  },
  {
    id: '4',
    patient: 'Santiago Ramírez',
    time: '3:30 PM',
    type: 'Control de crecimiento',
    doctor: 'Dr. Juan Pérez',
  },
  {
    id: '5',
    patient: 'Isabella Torres',
    time: '4:45 PM',
    type: 'Revisión',
    doctor: 'Dra. Ana López',
  },
];

export function UpcomingAppointments() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Próximas citas</h3>
        <Button variant="outline" size="sm" className="h-8">
          <Plus className="mr-2 h-4 w-4" />
          Nueva
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-2 h-4 w-4" />
          <span>Hoy, {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id} 
                className="rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{appointment.time}</span>
                      {appointment.isNew && (
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <h4 className="mt-2 font-medium">{appointment.patient}</h4>
                    <p className="text-sm text-muted-foreground">{appointment.type}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8">
                    Ver
                  </Button>
                </div>
                <div className="mt-3 flex items-center text-sm text-muted-foreground">
                  <User className="mr-1 h-4 w-4" />
                  {appointment.doctor}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
