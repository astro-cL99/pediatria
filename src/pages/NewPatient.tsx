import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

const patientSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100, "Máximo 100 caracteres"),
  rut: z.string().min(9, "RUT inválido").max(12, "RUT inválido"),
  dateOfBirth: z.string().min(1, "La fecha de nacimiento es requerida"),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
  headCircumference: z.string().optional(),
});

const NewPatient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: "",
      rut: "",
      dateOfBirth: "",
      bloodType: "",
      allergies: "",
      weightKg: "",
      heightCm: "",
      headCircumference: "",
    },
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

  const handleSubmit = async (values: z.infer<typeof patientSchema>) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Create patient
      const { data: patients, error: patientError } = await supabase
        .from("patients")
        .insert([{
          name: values.name,
          rut: values.rut,
          date_of_birth: values.dateOfBirth,
          blood_type: values.bloodType as any || null,
          allergies: values.allergies || null,
          created_by: user.id,
        }])
        .select();

      if (patientError) throw patientError;
      if (!patients || patients.length === 0) throw new Error("Error creating patient");
      
      const patient = patients[0];

      // If weight and height provided, create anthropometric and growth data
      if (values.weightKg && values.heightCm) {
        const weight = parseFloat(values.weightKg);
        const height = parseFloat(values.heightCm);
        const bmi = parseFloat(calculateBMI(weight, height));
        const bsa = parseFloat(calculateBodySurfaceArea(weight, height));

        const { error: anthroError } = await supabase
          .from("anthropometric_data")
          .insert([{
            patient_id: patient.id,
            weight_kg: weight,
            height_cm: height,
            bmi,
            body_surface_area: bsa,
            head_circumference_cm: values.headCircumference ? parseFloat(values.headCircumference) : null,
            measured_by: user.id,
          }]);

        if (anthroError) throw anthroError;

        // Also create growth measurement for charts
        await supabase.from("growth_measurements").insert([{
          patient_id: patient.id,
          weight_kg: weight,
          height_cm: height,
          head_circumference_cm: values.headCircumference ? parseFloat(values.headCircumference) : null,
          bmi,
          measured_by: user.id,
        }]);
      }

      // Audit log
      await supabase.from("audit_logs").insert([{
        table_name: "patients",
        record_id: patient.id,
        action: "CREATE",
        new_data: values as any,
        user_id: user.id,
      }]);

      toast.success("Paciente registrado exitosamente");
      navigate(`/patient/${patient.id}`);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Error al registrar paciente");
    } finally {
      setLoading(false);
    }
  };

  const weightKg = form.watch("weightKg");
  const heightCm = form.watch("heightCm");
  const bmi = calculateBMI(parseFloat(weightKg || "0"), parseFloat(heightCm || "0"));
  const bsa = calculateBodySurfaceArea(parseFloat(weightKg || "0"), parseFloat(heightCm || "0"));

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Datos Personales */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Datos Personales</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre del paciente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RUT *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678-9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Nacimiento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grupo Sanguíneo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alergias</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Alergias conocidas del paciente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Datos Antropométricos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Datos Antropométricos</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weightKg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="heightCm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Talla (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headCircumference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perímetro Cefálico (cm)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Calculated values */}
                  {weightKg && heightCm && parseFloat(weightKg) > 0 && parseFloat(heightCm) > 0 && (
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
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewPatient;
