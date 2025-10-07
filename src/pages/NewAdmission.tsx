import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PediatricOrdersForm } from "@/components/PediatricOrdersForm";
import { PhysicalExamForm } from "@/components/PhysicalExamForm";
import { MedicalAdmissionPreview } from "@/components/MedicalAdmissionPreview";

export default function NewAdmission() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtractingLab, setIsExtractingLab] = useState(false);
  const [selectedLabFile, setSelectedLabFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    age: "",
    rut: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    contactNumbers: "",
    caregiver: "",
    caregiverRut: "",
    patientWeight: undefined as number | undefined,
    patientHeight: undefined as number | undefined,
    admissionSource: "emergency",
    chiefComplaint: "",
    presentIllness: "",
    personalHistory: "",
    familyHistory: "",
    allergies: "",
    currentMedications: "",
    physicalExam: "",
    labResults: "",
    imagingResults: "",
    admissionDiagnoses: [] as string[],
    treatmentPlan: "",
    nursingOrders: "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo PDF",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setIsExtracting(true);

    try {
      // Import PDF.js dynamically (named exports for reliability)
      const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      // Upload to storage first
      const filePath = `dau/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Convert PDF to image
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      // Render first page to canvas
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo crear el canvas');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // @ts-ignore - pdfjs types issue
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to base64 image (PNG)
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

      // Call edge function to extract data with image
      const { data: extractedData, error: extractError } = await supabase.functions.invoke(
        'extract-dau-data',
        { body: { imageBase64, fileName: file.name } }
      );

      if (extractError) throw extractError;

      if (extractedData?.success && extractedData?.data) {
        const data = extractedData.data;
        
        // Auto-fill form with extracted data
        setFormData(prev => ({
          ...prev,
          patientName: data.patientName || prev.patientName,
          age: data.age || prev.age,
          rut: data.rut || prev.rut,
          dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
          gender: data.gender || prev.gender,
          address: data.address || prev.address,
          contactNumbers: data.contactNumbers || prev.contactNumbers,
          caregiver: data.caregiver || prev.caregiver,
          caregiverRut: data.caregiverRut || prev.caregiverRut,
          chiefComplaint: data.chiefComplaint || prev.chiefComplaint,
          presentIllness: data.presentIllness || prev.presentIllness,
          allergies: data.allergies || prev.allergies,
          personalHistory: data.personalHistory || prev.personalHistory,
          physicalExam: data.physicalExam || prev.physicalExam,
          labResults: data.labResults || prev.labResults,
          imagingResults: data.imagingResults || prev.imagingResults,
        }));

        toast({
          title: "Datos extraídos",
          description: "Se han completado automáticamente los campos del formulario",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo PDF",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleLabFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo PDF",
        variant: "destructive",
      });
      return;
    }

    setSelectedLabFile(file);
    setIsExtractingLab(true);

    try {
      const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      // Renderizar TODAS las páginas del PDF y convertirlas a imágenes base64
      const images: string[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No se pudo crear el canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        // @ts-ignore - pdfjs types issue
        await page.render({ canvasContext: context, viewport }).promise;
        const img = canvas.toDataURL('image/png').split(',')[1];
        images.push(img);
      }

      const { data: extractedData, error: extractError } = await supabase.functions.invoke(
        'extract-lab-results',
        { body: { imageBase64List: images, fileName: file.name } }
      );

      if (extractError) throw extractError;

      if (extractedData?.success && extractedData?.data) {
        const data = extractedData.data;
        
        // Formatear resultados por categorías con formato limpio
        let formattedResults = `- ${data.fechaToma} ${data.procedencia}:\n`;
        
        if (Array.isArray(data.resultados)) {
          data.resultados.forEach((categoria: any) => {
            formattedResults += `\n${categoria.categoria}:\n`;
            
            if (Array.isArray(categoria.examenes)) {
              categoria.examenes.forEach((examen: any) => {
                const alteradoMark = examen.alterado ? ' ⚠️' : '';
                const referencia = examen.referencia ? ` (VR: ${examen.referencia})` : '';
                formattedResults += `  ${examen.nombre}: ${examen.valor}${referencia}${alteradoMark}\n`;
              });
            }
          });
        }
        
        // Append to existing lab results or replace
        setFormData(prev => ({
          ...prev,
          labResults: prev.labResults 
            ? `${prev.labResults}\n${formattedResults}`
            : formattedResults
        }));

        toast({
          title: "Exámenes extraídos",
          description: "Los resultados de laboratorio se han agregado automáticamente",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo de laboratorio",
        variant: "destructive",
      });
    } finally {
      setIsExtractingLab(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("admissions").insert({
        patient_id: formData.patientId || null,
        admission_source: formData.admissionSource,
        chief_complaint: formData.chiefComplaint,
        present_illness: formData.presentIllness,
        personal_history: formData.personalHistory,
        family_history: formData.familyHistory,
        allergies: formData.allergies,
        current_medications: formData.currentMedications,
        physical_exam: formData.physicalExam,
        lab_results: formData.labResults ? JSON.parse(formData.labResults) : null,
        imaging_results: formData.imagingResults,
        admission_diagnoses: formData.admissionDiagnoses,
        treatment_plan: formData.treatmentPlan,
        nursing_orders: formData.nursingOrders,
        admitted_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Ingreso creado",
        description: "El paciente ha sido ingresado exitosamente",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el ingreso",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Nuevo Ingreso Hospitalario</h1>
          <p className="text-muted-foreground">Complete los datos del paciente a ingresar</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar DAU (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="dau-upload"
                disabled={isExtracting}
              />
              <Label htmlFor="dau-upload" className="cursor-pointer">
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Extrayendo datos del DAU...</p>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-primary" />
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">Click para cambiar archivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="h-12 w-12 text-primary" />
                    <p className="font-medium">Subir DAU en PDF</p>
                    <p className="text-sm text-muted-foreground">
                      El sistema extraerá automáticamente los datos importantes
                    </p>
                  </div>
                )}
              </Label>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos Administrativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del Paciente</Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <Label>RUT</Label>
                  <Input
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    placeholder="12345678-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Edad</Label>
                  <Input
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Ej: 06A 05m"
                  />
                </div>
                <div>
                  <Label>Fecha de Nacimiento</Label>
                  <Input
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
                <div>
                  <Label>Sexo</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Femenino">Femenino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Dirección</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>

              <div>
                <Label>Números de Contacto</Label>
                <Input
                  value={formData.contactNumbers}
                  onChange={(e) => setFormData({ ...formData, contactNumbers: e.target.value })}
                  placeholder="Teléfonos de contacto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Persona a Cargo</Label>
                  <Input
                    value={formData.caregiver}
                    onChange={(e) => setFormData({ ...formData, caregiver: e.target.value })}
                    placeholder="Nombre y relación"
                  />
                </div>
                <div>
                  <Label>RUT Persona a Cargo</Label>
                  <Input
                    value={formData.caregiverRut}
                    onChange={(e) => setFormData({ ...formData, caregiverRut: e.target.value })}
                    placeholder="12345678-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Peso del Paciente (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.patientWeight || ""}
                    onChange={(e) => setFormData({ ...formData, patientWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Peso en kg"
                  />
                </div>
                <div>
                  <Label>Talla del Paciente (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.patientHeight || ""}
                    onChange={(e) => setFormData({ ...formData, patientHeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Talla en cm"
                  />
                </div>
              </div>

              <div>
                <Label>Procedencia</Label>
                <Select value={formData.admissionSource} onValueChange={(value) => setFormData({ ...formData, admissionSource: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="emergency">Servicio de Urgencia</SelectItem>
                    <SelectItem value="outpatient">Policlínico</SelectItem>
                    <SelectItem value="transfer">Traslado Externo</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anamnesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Motivo de Consulta</Label>
                <Textarea
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Enfermedad Actual</Label>
                <Textarea
                  value={formData.presentIllness}
                  onChange={(e) => setFormData({ ...formData, presentIllness: e.target.value })}
                  rows={6}
                />
              </div>

              <div>
                <Label>Antecedentes Mórbidos</Label>
                <Textarea
                  value={formData.personalHistory}
                  onChange={(e) => setFormData({ ...formData, personalHistory: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Alergias</Label>
                <Select value={formData.allergies} onValueChange={(value) => setFormData({ ...formData, allergies: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="No refiere">No refiere</SelectItem>
                    <SelectItem value="Penicilina">Penicilina</SelectItem>
                    <SelectItem value="AINES">AINES</SelectItem>
                    <SelectItem value="Alimentos">Alimentos</SelectItem>
                    <SelectItem value="other">Otra (especificar en observaciones)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <PhysicalExamForm
            value={formData.physicalExam}
            onChange={(value) => setFormData({ ...formData, physicalExam: value })}
          />

          <Card>
            <CardHeader>
              <CardTitle>Exámenes y Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Exámenes de Laboratorio</Label>
                <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 mb-3 hover:border-primary/40 transition-colors">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleLabFileUpload}
                    className="hidden"
                    id="lab-upload"
                    disabled={isExtractingLab}
                  />
                  <Label htmlFor="lab-upload" className="cursor-pointer">
                    {isExtractingLab ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        <span className="text-muted-foreground">Extrayendo resultados...</span>
                      </div>
                    ) : selectedLabFile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{selectedLabFile.name}</span>
                        <span className="text-muted-foreground">- Click para agregar más</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="font-medium">Subir PDF de Laboratorio</span>
                        <span className="text-muted-foreground">(Resultados se agregarán automáticamente)</span>
                      </div>
                    )}
                  </Label>
                </div>
                <Textarea
                  value={formData.labResults}
                  onChange={(e) => setFormData({ ...formData, labResults: e.target.value })}
                  rows={6}
                  placeholder="- 06/10/25 SU HRR: Glucosa 111 LDH 383// CK total 31 CK-MB 14 // Crea 0.35 BUN 9.6..."
                />
              </div>

              <div>
                <Label>Imagenología</Label>
                <Textarea
                  value={formData.imagingResults}
                  onChange={(e) => setFormData({ ...formData, imagingResults: e.target.value })}
                  rows={3}
                  placeholder="Rx tórax, ECO, etc..."
                />
              </div>
            </CardContent>
          </Card>

          <PediatricOrdersForm
            value={formData.nursingOrders}
            onChange={(value) => setFormData({ ...formData, nursingOrders: value })}
            patientWeight={formData.patientWeight}
            patientHeight={formData.patientHeight}
          />

          <Card>
            <CardHeader>
              <CardTitle>Plan de Tratamiento (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                rows={4}
                placeholder="Notas adicionales sobre el plan de tratamiento..."
              />
            </CardContent>
          </Card>

          <MedicalAdmissionPreview formData={formData} />

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Crear Ingreso"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}