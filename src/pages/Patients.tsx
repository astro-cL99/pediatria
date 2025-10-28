import { Helmet } from "react-helmet-async";

const mockPatients = [
  { id: 1, name: "Juan Pérez", rut: "12.345.678-9", age: 7 },
  { id: 2, name: "María López", rut: "9.876.543-2", age: 3 },
  { id: 3, name: "Ana Torres", rut: "20.111.222-3", age: 12 },
];

export default function Patients() {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/patients` : "/patients";

  return (
    <>
      <Helmet>
        <title>Pacientes | PediaMed</title>
        <meta name="description" content="Listado y búsqueda de pacientes pediátricos" />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Pacientes</h1>

        <section className="mb-4">
          <label htmlFor="search" className="block text-sm text-muted-foreground mb-1">Buscar paciente</label>
          <input
            id="search"
            type="search"
            placeholder="Nombre o RUT"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </section>

        <section>
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                  <th className="px-4 py-2 text-left font-medium">RUT</th>
                  <th className="px-4 py-2 text-left font-medium">Edad</th>
                </tr>
              </thead>
              <tbody>
                {mockPatients.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2 text-foreground">{p.name}</td>
                    <td className="px-4 py-2 text-foreground/80">{p.rut}</td>
                    <td className="px-4 py-2 text-foreground/80">{p.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
