import { Helmet } from "react-helmet-async";

export default function Dashboard() {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard";
  return (
    <>
      <Helmet>
        <title>Dashboard pediátrico | PediaMed</title>
        <meta name="description" content="Dashboard pediátrico con indicadores clave y acceso rápido a módulos" />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <main className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">Dashboard pediátrico</h1>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-sm text-muted-foreground">Pacientes activos</h2>
            <p className="mt-2 text-2xl font-semibold text-foreground">—</p>
          </article>
          <article className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-sm text-muted-foreground">Ingresos hoy</h2>
            <p className="mt-2 text-2xl font-semibold text-foreground">—</p>
          </article>
          <article className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-sm text-muted-foreground">Altas hoy</h2>
            <p className="mt-2 text-2xl font-semibold text-foreground">—</p>
          </article>
          <article className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="text-sm text-muted-foreground">Alertas</h2>
            <p className="mt-2 text-2xl font-semibold text-foreground">—</p>
          </article>
        </section>
      </main>
    </>
  );
}
