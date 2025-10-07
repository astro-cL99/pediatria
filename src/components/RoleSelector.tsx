// FASE 8: Componente para seleccionar roles
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'viewer';

interface RoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as UserRole)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-card z-50">
        <SelectItem value="admin">Administrador</SelectItem>
        <SelectItem value="doctor">Médico Staff</SelectItem>
        <SelectItem value="nurse">Enfermería</SelectItem>
        <SelectItem value="viewer">Observador</SelectItem>
      </SelectContent>
    </Select>
  );
}
