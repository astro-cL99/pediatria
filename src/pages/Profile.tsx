import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, User, Lock, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState<string>("");
  const [biologicalSex, setBiologicalSex] = useState<string>("");
  const [positionConfigured, setPositionConfigured] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setEmail(user.email || "");

    // Verificar si es admin
    const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
    setIsAdmin(adminCheck || false);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, specialty, position, biological_sex, position_configured_at")
      .eq("id", user.id)
      .single();

    if (profile) {
      setFullName(profile.full_name || "");
      setSpecialty(profile.specialty || "");
      setPosition(profile.position || "");
      setBiologicalSex(profile.biological_sex || "");
      setPositionConfigured(!!profile.position_configured_at);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const updateData: any = {
        full_name: fullName,
        specialty: specialty,
      };

      // Solo permitir actualizar position y biological_sex si no están configurados o si es admin
      if (!positionConfigured || isAdmin) {
        if (position) updateData.position = position;
        if (biologicalSex) updateData.biological_sex = biologicalSex;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil actualizado exitosamente");
      fetchUserProfile(); // Refrescar datos
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Contraseña actualizada exitosamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Error al cambiar contraseña: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Administra tu información personal</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Actualiza tu nombre y especialidad médica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">
                El email no puede ser modificado
              </p>
            </div>

            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>

            <div>
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Pediatría"
              />
            </div>

            <Separator className="my-4" />

            {positionConfigured && !isAdmin && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El estamento profesional ya está configurado y solo puede ser modificado por un administrador.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="biologicalSex">Sexo Biológico</Label>
              <Select 
                value={biologicalSex} 
                onValueChange={setBiologicalSex}
                disabled={positionConfigured && !isAdmin}
              >
                <SelectTrigger id="biologicalSex">
                  <SelectValue placeholder="Selecciona tu sexo biológico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
              {positionConfigured && !isAdmin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Solo administradores pueden modificar este campo
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="position">Estamento Profesional</Label>
              <Select 
                value={position} 
                onValueChange={setPosition}
                disabled={positionConfigured && !isAdmin}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Selecciona tu estamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medico">
                    {biologicalSex === "femenino" ? "Médica" : "Médico"}
                  </SelectItem>
                  <SelectItem value="medico_becado">
                    {biologicalSex === "femenino" ? "Médica Becada" : "Médico Becado"}
                  </SelectItem>
                  <SelectItem value="interno">
                    {biologicalSex === "femenino" ? "Interna" : "Interno"}
                  </SelectItem>
                  <SelectItem value="enfermera">
                    {biologicalSex === "femenino" ? "Enfermera" : "Enfermero"}
                  </SelectItem>
                  <SelectItem value="tens">TENS</SelectItem>
                </SelectContent>
              </Select>
              {positionConfigured && !isAdmin && (
                <p className="text-xs text-muted-foreground mt-1">
                  Solo administradores pueden modificar este campo
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualiza tu contraseña de acceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Cambiar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
