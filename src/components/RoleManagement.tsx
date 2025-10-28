import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, UserCog } from "lucide-react";
import { toast } from "sonner";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  profiles?: {
    full_name: string;
  };
}

export function RoleManagement() {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
    fetchUserRoles();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.rpc('is_admin', { _user_id: user.id });
    setIsAdmin(data || false);
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("assigned_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const rolesWithProfiles = await Promise.all(
        (data || []).map(async (role) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", role.user_id)
            .single();
          
          return {
            ...role,
            profiles: profile || { full_name: "Usuario" },
          };
        })
      );

      setUserRoles(rolesWithProfiles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) {
      toast.error("No tienes permisos para cambiar roles");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert([{
          user_id: userId,
          role: newRole as any,
          assigned_by: user.id,
        }]);

      if (error) throw error;

      toast.success("Rol actualizado exitosamente");
      fetchUserRoles();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Error al actualizar rol");
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "doctor":
        return "default";
      case "nurse":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Administrador",
      doctor: "Doctor",
      nurse: "Enfermero/a",
      viewer: "Observador",
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando...
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gestión de Roles
          </CardTitle>
          <CardDescription>
            No tienes permisos para ver esta sección
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5" />
          Gestión de Roles y Permisos
        </CardTitle>
        <CardDescription>
          Administra los roles de los usuarios del sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userRoles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay usuarios con roles asignados
            </p>
          ) : (
            userRoles.map((userRole) => (
              <div
                key={userRole.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">
                      {userRole.profiles?.full_name || "Usuario"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Asignado: {new Date(userRole.assigned_at).toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(userRole.role)}>
                    {getRoleLabel(userRole.role)}
                  </Badge>
                </div>

                <Select
                  value={userRole.role}
                  onValueChange={(value) => handleRoleChange(userRole.user_id, value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Enfermero/a</SelectItem>
                    <SelectItem value="viewer">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">Descripción de Roles:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li><strong>Administrador:</strong> Acceso completo, puede gestionar roles</li>
            <li><strong>Doctor:</strong> Puede crear y editar ingresos, evoluciones</li>
            <li><strong>Enfermero/a:</strong> Puede ver y crear evoluciones</li>
            <li><strong>Observador:</strong> Solo puede ver información</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}