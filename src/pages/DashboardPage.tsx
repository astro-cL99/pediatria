import { Card } from '@/components/ui/card';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen y estadísticas de la unidad de pediatría
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Pacientes activos</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">24</p>
          <p className="mt-1 text-sm text-gray-500">+2 desde ayer</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Altas del día</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">3</p>
          <p className="mt-1 text-sm text-gray-500">+1 que ayer</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Camas ocupadas</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">18/24</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-600 h-2.5 rounded-full" 
              style={{ width: '75%' }}
            ></div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Próximos egresos</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">5</p>
          <p className="mt-1 text-sm text-gray-500">Programados para hoy</p>
        </Card>
      </div>

      {/* Sección de actividad reciente */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad reciente</h2>
        <Card>
          <div className="p-6">
            <p className="text-gray-500 text-center py-8">
              Próximamente: Actividad reciente de pacientes y médicos
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
