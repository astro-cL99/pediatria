import { Card } from '@/components/ui/card';

export function ShiftsPage() {
  // Datos de ejemplo para la vista previa
  const shifts = [
    {
      id: 1,
      date: 'Lunes 23 Oct',
      doctor: 'Dra. María González',
      time: '08:00 - 20:00',
      status: 'En curso',
      patients: 12,
      type: 'Diurno',
    },
    {
      id: 2,
      date: 'Martes 24 Oct',
      doctor: 'Dr. Carlos Méndez',
      time: '20:00 - 08:00',
      status: 'Pendiente',
      patients: 8,
      type: 'Nocturno',
    },
    {
      id: 3,
      date: 'Miércoles 25 Oct',
      doctor: 'Dra. Ana Torres',
      time: '08:00 - 20:00',
      status: 'Pendiente',
      patients: 10,
      type: 'Diurno',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Turnos Médicos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestión de turnos y asignación de pacientes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Nuevo Turno</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                  Médico
                </label>
                <select
                  id="doctor"
                  name="doctor"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  defaultValue=""
                >
                  <option value="">Seleccionar médico</option>
                  <option>Dra. María González</option>
                  <option>Dr. Carlos Méndez</option>
                  <option>Dra. Ana Torres</option>
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="shift-type" className="block text-sm font-medium text-gray-700">
                  Tipo de turno
                </label>
                <select
                  id="shift-type"
                  name="shift-type"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  defaultValue=""
                >
                  <option value="">Seleccionar tipo</option>
                  <option>Diurno (08:00 - 20:00)</option>
                  <option>Nocturno (20:00 - 08:00)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Programar turno
                </button>
              </div>
            </form>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Próximos turnos</h2>
            </div>
            <div className="bg-white overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <li key={shift.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {shift.doctor.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {shift.doctor}
                          </div>
                          <div className="text-sm text-gray-500">
                            {shift.date} • {shift.time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {shift.status}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {shift.patients} pacientes
                        </span>
                        <button
                          type="button"
                          className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 text-right">
              <a
                href="#"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                Ver todos los turnos <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
