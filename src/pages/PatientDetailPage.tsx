import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  // Datos de ejemplo para la vista previa
  const patient = {
    id,
    firstName: 'Juan',
    lastName: 'Pérez',
    age: '5 años',
    gender: 'Masculino',
    identifier: '12.345.678-9',
    bloodType: 'O+',
    admissionDate: '15/10/2023',
    diagnosis: 'Neumonía',
    status: 'Estable',
    bed: 'Cama 12',
    doctor: 'Dra. María González',
    allergies: ['Penicilina'],
    chronicConditions: ['Asma'],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {patient.firstName} {patient.lastName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Detalles del paciente y evolución clínica
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información del paciente */}
        <div className="md:col-span-1">
          <Card className="overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Información del Paciente</h2>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Identificación</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.identifier}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Edad</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.age}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Género</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.gender}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo de Sangre</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.bloodType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Fecha de Ingreso</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.admissionDate}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cama</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.bed}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Médico Tratante</dt>
                  <dd className="mt-1 text-sm text-gray-900">{patient.doctor}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Alergias</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.allergies.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {patient.allergies.map((allergy, index) => (
                          <li key={index}>{allergy}</li>
                        ))}
                      </ul>
                    ) : 'Ninguna conocida'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Condiciones Crónicas</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {patient.chronicConditions.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {patient.chronicConditions.map((condition, index) => (
                          <li key={index}>{condition}</li>
                        ))}
                      </ul>
                    ) : 'Ninguna'}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Tarjeta de diagnóstico */}
          <Card>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Diagnóstico Principal</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {patient.status}
              </span>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">{patient.diagnosis}</h3>
              <p className="text-gray-600">
                Paciente con diagnóstico de neumonía adquirida en la comunidad. En tratamiento con antibióticos y monitoreo de signos vitales.
              </p>
            </div>
          </Card>

          {/* Evolución */}
          <Card>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Evolución Clínica</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="border-l-4 border-primary-500 pl-4 py-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-medium text-gray-900">20/10/2023 - 10:30 AM</h4>
                    <span className="text-xs text-gray-500">Dr. Carlos Méndez</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Paciente con mejoría de la disnea y la fiebre. Saturación de oxígeno estable en 96% con aire ambiente. 
                    Se continúa tratamiento con amoxicilina-ácido clavulánico. Dieta habitual, buena tolerancia.
                  </p>
                </div>

                <div className="border-l-4 border-primary-500 pl-4 py-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-medium text-gray-900">19/10/2023 - 09:15 AM</h4>
                    <span className="text-xs text-gray-500">Dra. Ana Torres</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Paciente con fiebre de 38°C, taquipnea y leve tiraje subcostal. Saturación 94% con aire ambiente. 
                    Se inicia tratamiento con amoxicilina-ácido clavulánico. Control de signos vitales cada 6 horas.
                  </p>
                </div>

                <div className="border-l-4 border-primary-500 pl-4 py-1">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-sm font-medium text-gray-900">18/10/2023 - 03:45 PM</h4>
                    <span className="text-xs text-gray-500">Dr. Carlos Méndez</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    Paciente ingresa por tos productiva, fiebre de 38.5°C y dificultad respiratoria. 
                    Se realiza radiografía de tórax que muestra infiltrado en lóbulo inferior derecho. 
                    Se diagnostica neumonía adquirida en la comunidad. Se indica hospitalización.
                  </p>
                </div>
              </div>

              <div className="mt-6">
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
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Agregar evolución
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
