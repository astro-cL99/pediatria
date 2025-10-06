import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const NewPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: "",
    weightKg: "",
    heightCm: "",
    headCircumference: "",
  });

  const calculateBMI = (weight: number, height: number): string => {
    if (!weight || !height) return "0.00";
    return (weight / Math.pow(height / 100, 2)).toFixed(2);
  };

  const calculateBodySurfaceArea = (weight: number, height: number): string => {
    if (!weight || !height) return "0.000";
    // Fórmula de Mosteller
    return (Math.sqrt((height * weight) / 3600)).toFixed(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Create patient
      const { data: patients, error: patientError } = await supabase
        .from("patients")
        .insert([{
          name: formData.name,
          rut: formData.rut,
          date_of_birth: formData.dateOfBirth,
          blood_type: formData.bloodType as any || null,
          allergies: formData.allergies || null,
          created_by: user.id,
        }])
        .select();

      if (patientError) throw patientError;
      if (!patients || patients.length === 0) throw new Error("Error creating patient");
      
      const patient = patients[0];

      // If weight and height provided, create anthropometric data
      if (formData.weightKg && formData.heightCm) {
        const weight = parseFloat(formData.weightKg);
        const height = parseFloat(formData.heightCm);
        const bmi = parseFloat(calculateBMI(weight, height));
        const bsa = parseFloat(calculateBodySurfaceArea(weight, height));

        const { error: anthroError } = await supabase
          .from("anthropometric_data")
          .insert({
            patient_id: patient.id,
            weight_kg: weight,
            height_cm: height,
            bmi,
            body_surface_area: bsa,
            head_circumference_cm: formData.headCircumference ? parseFloat(formData.headCircumference) : null,
            measured_by: user.id,
          });

        if (anthroError) throw anthroError;
      }

      toast.success("Paciente registrado exitosamente");
      navigate(`/patient/${patient.id}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al registrar paciente");
    } finally {
      setLoading(false);
    }
  };

  const bmi = calculateBMI(parseFloat(formData.weightKg), parseFloat(formData.heightCm));
  const bsa = calculateBodySurfaceArea(parseFloat(formData.weightKg), parseFloat(formData.heightCm));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nuevo Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos Personales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Datos Personales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Nombre del paciente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT *</Label>
                    <Input
                      id="rut"
                      value={formData.rut}
                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                      required
                      placeholder="12345678-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Grupo Sanguíneo</Label>
                    <Select
                      value={formData.bloodType}
                      onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Alergias</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Alergias conocidas del paciente"
                  />
                </div>
              </div>

              {/* Datos Antropométricos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Datos Antropométricos</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Talla (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.01"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headCircumference">Perímetro Cefálico (cm)</Label>
                    <Input
                      id="headCircumference"
                      type="number"
                      step="0.01"
                      value={formData.headCircumference}
                      onChange={(e) => setFormData({ ...formData, headCircumference: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Calculated values */}
                {formData.weightKg && formData.heightCm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-accent/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">IMC Calculado</p>
                      <p className="text-2xl font-bold text-primary">{bmi} kg/m²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Superficie Corporal</p>
                      <p className="text-2xl font-bold text-secondary">{bsa} m²</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Guardando..." : "Guardar Paciente"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewPatient;
