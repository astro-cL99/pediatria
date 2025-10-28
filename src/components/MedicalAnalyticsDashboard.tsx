import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bed, Clock, AlertTriangle, Pill, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  target?: number;
  description?: string;
  variant?: 'default' | 'critical';
}

const StatCard = ({ title, value, change, icon: Icon, trend, target, description, variant = 'default' }: StatCardProps) => {
  const isCritical = variant === 'critical';
  const borderColor = isCritical ? 'hsl(var(--critical))' : 'hsl(var(--primary))';
  const iconColor = isCritical ? 'hsl(var(--critical))' : 'hsl(var(--primary))';
  const valueColor = isCritical ? 'hsl(var(--critical))' : 'hsl(var(--primary))';

  return (
    <Card className="medical-card border-l-4" style={{ borderLeftColor: borderColor }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: valueColor }}>{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {change > 0 ? (
              <TrendingUp className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
            ) : change < 0 ? (
              <TrendingDown className="h-3 w-3" style={{ color: 'hsl(var(--critical))' }} />
            ) : (
              <Minus className="h-3 w-3 text-muted-foreground" />
            )}
            <span style={{ color: change > 0 ? 'hsl(var(--success))' : change < 0 ? 'hsl(var(--critical))' : 'inherit' }}>
              {change > 0 ? '+' : ''}{change}% vs. anterior
            </span>
          </div>
        )}
        {target && (
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min((Number(value) / target) * 100, 100)}%`,
                  backgroundColor: valueColor
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Objetivo: {target}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function MedicalAnalyticsDashboard() {
  const navigate = useNavigate();

  // Datos de ejemplo - en producción estos vendrían de la base de datos
  const analytics = {
    occupancyRate: 78,
    occupancyChange: 5,
    avgStayDays: 4.2,
    stayChange: -8,
    criticalPatients: 3,
    criticalChange: 0,
    activeAntibiotics: 12,
    topDiagnoses: [
      { name: 'Neumonía adquirida en la comunidad', code: 'J18.9', count: 8 },
      { name: 'Bronquiolitis aguda', code: 'J21.9', count: 6 },
      { name: 'Gastroenteritis aguda', code: 'A09', count: 5 },
      { name: 'Asma bronquial', code: 'J45.9', count: 4 },
      { name: 'Infección urinaria', code: 'N39.0', count: 3 },
    ],
    totalPatients: 25,
    activeAlerts: [
      {
        title: 'Antibiótico por finalizar',
        description: 'Paciente Juan Pérez - Ceftriaxona termina mañana',
        severity: 'default' as const,
        actionLink: '/patients/123'
      },
      {
        title: 'Laboratorio pendiente',
        description: '2 pacientes con exámenes sin revisar',
        severity: 'default' as const,
        actionLink: '/dashboard'
      }
    ]
  };

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* KPIs Médicos Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tasa de Ocupación"
          value={`${analytics.occupancyRate}%`}
          change={analytics.occupancyChange}
          icon={Bed}
          trend={analytics.occupancyChange > 0 ? 'up' : 'down'}
          target={85}
        />
        
        <StatCard
          title="Estancia Promedio"
          value={`${analytics.avgStayDays} días`}
          change={analytics.stayChange}
          icon={Clock}
          trend={analytics.stayChange < 0 ? 'up' : 'down'}
          description="vs. mes anterior"
        />
        
        <StatCard
          title="Pacientes Críticos"
          value={analytics.criticalPatients}
          change={analytics.criticalChange}
          icon={AlertTriangle}
          variant="critical"
          description="Requieren atención inmediata"
        />
        
        <StatCard
          title="Tratamientos ATB"
          value={analytics.activeAntibiotics}
          icon={Pill}
          description="Terapias activas"
        />
      </div>

      {/* Distribución de Diagnósticos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Diagnósticos Más Frecuentes</CardTitle>
            <CardDescription>Top 5 este mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topDiagnoses.map((diagnosis, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{diagnosis.name}</p>
                      <p className="text-xs text-muted-foreground">{diagnosis.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${(diagnosis.count / analytics.totalPatients) * 100}%`,
                          backgroundColor: 'hsl(var(--primary))'
                        }}
                      />
                    </div>
                    <Badge variant="outline">{diagnosis.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardHeader>
            <CardTitle>Alertas Activas</CardTitle>
            <CardDescription>Requieren seguimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.activeAlerts.map((alert, idx) => (
                <Alert key={idx} variant={alert.severity}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>
                    {alert.description}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-2 text-xs"
                      onClick={() => navigate(alert.actionLink)}
                    >
                      Ver detalles →
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
              {analytics.activeAlerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No hay alertas pendientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
