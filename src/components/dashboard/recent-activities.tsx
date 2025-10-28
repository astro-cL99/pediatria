import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, User, Clock, Stethoscope, FileText } from 'lucide-react';

type ActivityType = {
  id: string;
  type: 'appointment' | 'record' | 'prescription' | 'other';
  title: string;
  description: string;
  time: string;
  user: string;
};

const activities: ActivityType[] = [
  {
    id: '1',
    type: 'appointment',
    title: 'Nueva cita programada',
    description: 'Control pediátrico para Sofía Martínez',
    time: 'Hace 5 minutos',
    user: 'Dr. Juan Pérez',
  },
  {
    id: '2',
    type: 'record',
    title: 'Expediente actualizado',
    description: 'Se actualizó el historial de vacunas',
    time: 'Hace 1 hora',
    user: 'Enf. Laura Gómez',
  },
  {
    id: '3',
    type: 'prescription',
    title: 'Nueva receta médica',
    description: 'Amoxicilina 250mg/5ml - 1 cucharada cada 8 horas',
    time: 'Hace 3 horas',
    user: 'Dr. Carlos Rojas',
  },
  {
    id: '4',
    type: 'appointment',
    title: 'Cita cancelada',
    description: 'Control de niño sano - Andrés López',
    time: 'Ayer',
    user: 'Sistema',
  },
  {
    id: '5',
    type: 'record',
    title: 'Nuevo paciente registrado',
    description: 'Valentina González - 4 años',
    time: 'Ayer',
    user: 'Recepcionista',
  },
];

const getActivityIcon = (type: ActivityType['type']) => {
  switch (type) {
    case 'appointment':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'record':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'prescription':
      return <Stethoscope className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

export function RecentActivities() {
  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-6">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div className="rounded-full bg-gray-100 p-2 mr-3">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{activity.title}</h4>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              <div className="mt-1 flex items-center text-xs text-muted-foreground">
                <User className="mr-1 h-3 w-3" />
                {activity.user}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
