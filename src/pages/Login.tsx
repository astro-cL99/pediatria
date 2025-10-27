import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState<string>("");
  const [biologicalSex, setBiologicalSex] = useState<string>("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!position || !biologicalSex) {
          toast.error("Por favor completa todos los campos del estamento");
          setLoading(false);
          return;
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "doctor",
            },
          },
        });

        if (authError) throw authError;

        // Actualizar el perfil con el estamento y sexo biológico
        if (authData.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              position: position as any,
              biological_sex: biologicalSex as any,
            })
            .eq("id", authData.user.id);

          if (profileError) {
            console.error("Error updating profile:", profileError);
            toast.error("Cuenta creada pero hubo un error al configurar el estamento");
          }
        }

        toast.success("Cuenta creada exitosamente");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Bienvenido a PediaMed");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Error en la autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-2">
            <Activity className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">PediaMed</CardTitle>
          <CardDescription className="text-base">
            {isSignUp ? "Crear cuenta nueva" : "Iniciar sesión en el sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Ej: Juan Pérez González"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biologicalSex">Sexo Biológico</Label>
                  <Select value={biologicalSex} onValueChange={setBiologicalSex} required>
                    <SelectTrigger id="biologicalSex">
                      <SelectValue placeholder="Selecciona tu sexo biológico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Estamento Profesional</Label>
                  <Select value={position} onValueChange={setPosition} required>
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
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="doctor@hospital.cl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={12}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Procesando..." : isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
