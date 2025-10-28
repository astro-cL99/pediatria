import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Stethoscope, FileText } from 'lucide-react';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { UpcomingAppointments } from '@/components/dashboard/upcoming-appointments';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground">
          Bienvenido de nuevo. Aquí tienes un resumen de tu actividad reciente.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Citas de hoy"
          value="12"
          description="+2 respecto a ayer"
          icon={Calendar}
          color="blue"
        />
        <StatsCard
          title="Pacientes activos"
          value="1,234"
          description="+12% respecto al mes pasado"
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Consultas este mes"
          value="156"
          description="+8% respecto al mes pasado"
          icon={Stethoscope}
          color="purple"
        />
        <StatsCard
          title="Expedientes"
          value="2,456"
          description="+120 este mes"
          icon={FileText}
          color="orange"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivities />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Próximas citas</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingAppointments />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function StatsCard({ title, value, description, icon: Icon, color }: StatsCardProps) {
  const colorVariants = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorVariants[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
