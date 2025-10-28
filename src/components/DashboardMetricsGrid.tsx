import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity, Users, Clock, AlertTriangle, Bed, Pill, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'critical';
  subtitle?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend, 
  target, 
  description, 
  variant = 'default',
  subtitle 
}: MetricCardProps) => {
  const variants = {
    default: {
      border: 'hsl(var(--primary))',
      icon: 'hsl(var(--primary))',
      bg: 'hsl(var(--primary) / 0.05)'
    },
    success: {
      border: 'hsl(var(--success))',
      icon: 'hsl(var(--success))',
      bg: 'hsl(var(--success) / 0.05)'
    },
    warning: {
      border: 'hsl(var(--warning))',
      icon: 'hsl(var(--warning))',
      bg: 'hsl(var(--warning) / 0.05)'
    },
    critical: {
      border: 'hsl(var(--critical))',
      icon: 'hsl(var(--critical))',
      bg: 'hsl(var(--critical) / 0.05)'
    }
  };

  const style = variants[variant];

  return (
    <Card 
      className="medical-card border-l-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group" 
      style={{ borderLeftColor: style.border }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div 
          className="h-10 w-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundColor: style.bg }}
        >
          <Icon className="h-5 w-5" style={{ color: style.icon }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: style.icon }}>
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {change !== undefined && (
          <div className="flex items-center gap-2">
            {change > 0 ? (
              <TrendingUp className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
            ) : change < 0 ? (
              <TrendingDown className="h-4 w-4" style={{ color: 'hsl(var(--critical))' }} />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span 
              className="text-sm font-medium"
              style={{ 
                color: change > 0 ? 'hsl(var(--success))' : change < 0 ? 'hsl(var(--critical))' : 'inherit' 
              }}
            >
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-muted-foreground">vs. ayer</span>
          </div>
        )}

        {target && (
          <div className="space-y-2">
            <Progress 
              value={Math.min((Number(value) / target) * 100, 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground flex justify-between">
              <span>Objetivo: {target}</span>
              <span className="font-medium">{Math.round((Number(value) / target) * 100)}%</span>
            </p>
          </div>
        )}

        {description && !target && (
          <p className="text-xs text-muted-foreground border-t pt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

interface DashboardMetricsGridProps {
  metrics: {
    totalPatients: number;
    occupancyRate: number;
    criticalPatients: number;
    averageStay: number;
    activeAntibiotics: number;
    pendingDischarges: number;
    todayAdmissions: number;
    oxygenPatients: number;
    patientChange?: number;
    occupancyChange?: number;
    stayChange?: number;
  };
}

export function DashboardMetricsGrid({ metrics }: DashboardMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
      <MetricCard
        title="Pacientes Activos"
        value={metrics.totalPatients}
        change={metrics.patientChange}
        icon={Users}
        variant="default"
        subtitle="Bajo tu cuidado"
      />

      <MetricCard
        title="Ocupación"
        value={`${metrics.occupancyRate}%`}
        change={metrics.occupancyChange}
        icon={Bed}
        variant={metrics.occupancyRate > 85 ? 'warning' : 'success'}
        target={85}
      />

      <MetricCard
        title="Pacientes Críticos"
        value={metrics.criticalPatients}
        icon={AlertTriangle}
        variant="critical"
        description="Requieren atención inmediata"
      />

      <MetricCard
        title="Estancia Promedio"
        value={`${metrics.averageStay} días`}
        change={metrics.stayChange}
        icon={Clock}
        variant="default"
        subtitle="vs. mes anterior"
      />

      <MetricCard
        title="Ingresos Hoy"
        value={metrics.todayAdmissions}
        icon={Activity}
        variant="success"
        description="Nuevos pacientes admitidos"
      />

      <MetricCard
        title="Altas Próximas"
        value={metrics.pendingDischarges}
        icon={TrendingUp}
        variant="warning"
        description="Próximos 3 días"
      />

      <MetricCard
        title="Soporte O₂"
        value={metrics.oxygenPatients}
        icon={Activity}
        variant={metrics.oxygenPatients > 5 ? 'warning' : 'default'}
        description="Pacientes con oxigenoterapia"
      />

      <MetricCard
        title="Terapias ATB"
        value={metrics.activeAntibiotics}
        icon={Pill}
        variant="default"
        description="Tratamientos antibióticos activos"
      />
    </div>
  );
}