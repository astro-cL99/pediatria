import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            PedIAtrics - Sistema de Gestión Pediátrica
          </h1>
          <p className="text-lg text-muted-foreground">
            Sistema integral de gestión pediátrica para hospitales de alta complejidad
          </p>
        </div>
      </div>
      <Toaster />
    </>
  );
}

export default App;
