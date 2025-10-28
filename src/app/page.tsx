import { Button } from '@/components/ui/button';
import { PatientForm } from '@/components/forms/patient-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Agregar Paciente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nuevo Paciente</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <PatientForm />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <p className="text-muted-foreground">
          Aquí se mostrará la lista de pacientes. Haz clic en "Agregar Paciente" para comenzar.
        </p>
      </div>
    </main>
  );
}
