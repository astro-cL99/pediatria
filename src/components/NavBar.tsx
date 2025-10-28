import { NavLink } from "react-router-dom";

export function NavBar() {
  const linkBase =
    "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const active = " bg-primary text-primary-foreground";
  const inactive =
    " text-foreground/80 hover:text-foreground hover:bg-accent";

  return (
    <header className="border-b bg-background">
      <nav className="container mx-auto flex items-center justify-between py-3">
        <NavLink to="/dashboard" className="text-lg font-semibold text-foreground">
          PediaMed
        </NavLink>
        <div className="flex gap-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/patients"
            className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}
          >
            Pacientes
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
