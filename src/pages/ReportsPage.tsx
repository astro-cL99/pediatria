import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ReportsPage() {
  // Datos de ejemplo para gráficos
  const stats = [
    { name: 'Pacientes activos', value: '24', change: '+12%', changeType: 'increase' },
    { name: 'Estadía promedio', value: '4.5', unit: 'días', change: '-0.5', changeType: 'decrease' },
    { name: 'Tasa de ocupación', value: '85', unit: '%', change: '+5%', changeType: 'increase' },
    { name: 'Reingresos (30 días)', value: '2', change: '-1', changeType: 'decrease' },
  ];

  const recentAdmissions = [
    { id: 1, name: 'Juan Pérez', date: '2023-10-20', diagnosis: 'Neumonía', status: 'Estable' },
    { id: 2, name: 'María González', date: '2023-10-19', diagnosis: 'Bronquiolitis', status: 'Grave' },
    { id: 3, name: 'Carlos López', date: '2023-10-18', diagnosis: 'Gastroenteritis', status: 'Mejorando' },
    { id: 4, name: 'Ana Torres', date: '2023-10-17', diagnosis: 'Asma', status: 'Estable' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Informes y Estadísticas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Análisis y reportes de la unidad de pediatría
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
            <dd className="mt-1 flex items-baseline">
              <div className="flex items-baseline text-2xl font-semibold text-gray-900">
                {stat.value}
                {stat.unit && <span className="ml-2 text-sm font-medium text-gray-500">{stat.unit}</span>}
              </div>
              <div
                className={cn(
                  stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                  'ml-2 flex items-baseline px-2.5 py-0.5 rounded-full text-xs font-medium md:mt-2 lg:mt-0'
                )}
              >
                {stat.change}
              </div>
            </dd>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de ocupación */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Ocupación de camas (últimos 7 días)</h2>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Gráfico de ocupación de camas</p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>La tasa de ocupación promedio fue del 82% en los últimos 7 días.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admisiones recientes */}
        <div>
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Admisiones recientes</h2>
            </div>
            <div className="flow-root">
              <ul className="divide-y divide-gray-200">
                {recentAdmissions.map((admission) => (
                  <li key={admission.id} className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {admission.name}
                        </div>
                        <div className="flex">
                          <p className="text-sm text-gray-500">
                            {new Date(admission.date).toLocaleDateString()}
                          </p>
                          <p className="ml-2 text-sm text-gray-500">• {admission.diagnosis}</p>
                        </div>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {admission.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <a
                href="#"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Ver todas las admisiones <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Diagnósticos más comunes */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Diagnósticos más comunes</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Gráfico de diagnósticos</p>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { name: 'Infección respiratoria aguda', count: 12, percentage: 25 },
                { name: 'Gastroenteritis aguda', count: 8, percentage: 16 },
                { name: 'Infección urinaria', count: 5, percentage: 10 },
                { name: 'Bronquiolitis', count: 4, percentage: 8 },
                { name: 'Otros', count: 21, percentage: 41 },
              ].map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium text-gray-900">{item.count} casos ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Tiempos de espera */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tiempos de espera</h2>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
              <p className="text-gray-500">Gráfico de tiempos de espera</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tiempo promedio de espera</span>
                  <span className="font-medium text-gray-900">1h 25m</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Tiempo máximo de espera</span>
                  <span className="font-medium text-gray-900">3h 10m</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pacientes en espera actualmente</span>
                  <span className="font-medium text-gray-900">4</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Exportar informe
        </button>
      </div>
    </div>
  );
}
