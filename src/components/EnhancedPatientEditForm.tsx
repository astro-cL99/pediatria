import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, 
  FileText, 
  Loader2, 
  Sparkles, 
  X,
  Calculator
} from "lucide-react";

// Import existing components
import { PhysicalExamForm } from "./PhysicalExamForm";
import { PediatricOrdersForm } from "./PediatricOrdersForm";
import { CIE10Search } from "./CIE10Search";
import { ProtocolTemplateSelector } from "./ProtocolTemplateSelector";
import { AllergyAlert } from "./AllergyAlert";
import { OxygenTherapySelector } from "./OxygenTherapySelector";
import { ScoreSelector } from "./ScoreSelector";
import { FluidTherapyCalculator } from "./FluidTherapyCalculator";

interface EnhancedPatientEditFormProps {
  admissionId: string;
  patientId: string;
  currentData: {
    admission_diagnoses?: string[];
    oxygen_requirement?: any;
    respiratory_score?: string;
    viral_panel?: string;
    pending_tasks?: string;
    antibiotics?: any;
    current_medications?: string;
    diet?: any;
    iv_therapy?: any;
    present_illness?: string;
    personal_history?: string;
    family_history?: string;
    allergies?: string;
    physical_exam?: string;
    lab_results?: string;
    imaging_results?: string;
    treatment_plan?: string;
    nursing_orders?: string;
  };
  patientData?: {
    weight_kg?: number;
    height_cm?: number;
    date_of_birth?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function EnhancedPatientEditForm({ 
  admissionId, 
  patientId,
  currentData, 
  patientData,
  onSuccess, 
  onCancel 
}: EnhancedPatientEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [isExtractingDAU, setIsExtractingDAU] = useState(false);
  const [isExtractingLab, setIsExtractingLab] = useState(false);
  const [isProcessingAnamnesis, setIsProcessingAnamnesis] = useState(false);
  
  const [formData, setFormData] = useState({
    // Clinical data
    diagnoses: currentData.admission_diagnoses || [],
    presentIllness: currentData.present_illness || "",
    personalHistory: currentData.personal_history || "",
    familyHistory: currentData.family_history || "",
    allergies: currentData.allergies || "",
    physicalExam: currentData.physical_exam || "",
    labResults: currentData.lab_results || "",
    imagingResults: currentData.imaging_results || "",
    
    // Oxygen and respiratory
    oxygenType: currentData.oxygen_requirement?.type || "",
    oxygenFlow: currentData.oxygen_requirement?.flow || "",
    oxygenPeep: currentData.oxygen_requirement?.peep || "",
    oxygenFio2: currentData.oxygen_requirement?.fio2 || "",
    respiratoryScore: currentData.respiratory_score || "",
    viralPanel: currentData.viral_panel || "",
    
    // Medications
    medications: currentData.current_medications || "",
    
    // Diet
    dietType: currentData.diet?.type || "",
    dietNotes: currentData.diet?.notes || "",
    
    // IV Therapy
    ivTherapyActive: currentData.iv_therapy?.active || false,
    ivTherapyType: currentData.iv_therapy?.type || "",
    ivTherapyPercentage: currentData.iv_therapy?.percentage || "",
    
    // Others
    pendingTasks: currentData.pending_tasks || "",
    treatmentPlan: currentData.treatment_plan || "",
    nursingOrders: currentData.nursing_orders || "",
  });

  const [diagnosisInput, setDiagnosisInput] = useState("");

  const handleDAUUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error("Por favor selecciona un archivo PDF");
      return;
    }

    setIsExtractingDAU(true);

    try {
      const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No se pudo crear el canvas');
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // @ts-ignore
      await page.render({ canvasContext: context, viewport }).promise;
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

      const response = await supabase.functions.invoke('extract-dau-data', { 
        body: { imageBase64, fileName: file.name }
      });

      if (response.error) throw response.error;

      const extractedData = response.data;
      if (extractedData?.success && extractedData?.data) {
        const data = extractedData.data;
        setFormData(prev => ({
          ...prev,
          presentIllness: data.presentIllness || prev.presentIllness,
          allergies: data.allergies || prev.allergies,
          personalHistory: data.personalHistory || prev.personalHistory,
          physicalExam: data.physicalExam || prev.physicalExam,
          labResults: data.labResults || prev.labResults,
          imagingResults: data.imagingResults || prev.imagingResults,
        }));

        toast.success("Datos extraídos del DAU automáticamente");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo procesar el archivo PDF");
    } finally {
      setIsExtractingDAU(false);
    }
  };

  const handleLabUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error("Por favor selecciona un archivo PDF");
      return;
    }

    setIsExtractingLab(true);
    toast.info("Extrayendo datos del laboratorio con IA...");

    try {
      const { getDocument, GlobalWorkerOptions, version } = await import('pdfjs-dist');
      GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      const images: string[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No se pudo crear el canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        // @ts-ignore
        await page.render({ canvasContext: context, viewport }).promise;
        images.push(canvas.toDataURL('image/png').split(',')[1]);
      }

      const { data: extractedData, error } = await supabase.functions.invoke(
        'extract-lab-results',
        { body: { imageBase64List: images, fileName: file.name } }
      );

      if (error) throw error;

      if (extractedData?.success && extractedData?.data) {
        const data = extractedData.data;
        
        // Formato mejorado con marcadores de anormalidades
        let formattedResults = `📋 ${data.metadata?.sampleDate || 'Fecha no especificada'} - ${data.metadata?.origin || ''}\n`;
        formattedResults += `Solicitud: ${data.metadata?.requestNumber || 'N/A'}\n\n`;
        
        // Iterar por secciones
        if (data.sections) {
          for (const [sectionName, exams] of Object.entries(data.sections)) {
            if (!Array.isArray(exams) || exams.length === 0) continue;
            
            formattedResults += `\n【${sectionName}】\n`;
            
            for (const exam of exams as any[]) {
              const criticalMark = exam.isCritical ? ' 🔴 CRÍTICO' : '';
              const abnormalMark = exam.isAbnormal && !exam.isCritical ? ' ⚠️' : '';
              const valuePart = typeof exam.value === 'number' ? exam.value.toFixed(2) : exam.value;
              const unitPart = exam.unit ? ` ${exam.unit}` : '';
              const refPart = exam.referenceRange ? ` (VR: ${exam.referenceRange})` : '';
              
              formattedResults += `  • ${exam.name}: ${valuePart}${unitPart}${refPart}${criticalMark}${abnormalMark}\n`;
            }
          }
        }
        
        formattedResults += `\n✅ ${data.totalExams || 0} exámenes extraídos (Confianza: ${((data.confidence || 0) * 100).toFixed(0)}%)\n`;
        
        setFormData(prev => ({
          ...prev,
          labResults: prev.labResults 
            ? `${prev.labResults}\n\n${formattedResults}`
            : formattedResults
        }));

        toast.success(`✅ ${data.totalExams || 0} exámenes extraídos automáticamente`);
      } else {
        throw new Error('No se pudieron extraer datos del laboratorio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo procesar el archivo PDF del laboratorio");
    } finally {
      setIsExtractingLab(false);
    }
  };

  const handleProcessAnamnesis = async () => {
    if (!formData.presentIllness || formData.presentIllness.trim().length < 20) {
      toast.error("Escribe al menos 20 caracteres para procesar la anamnesis");
      return;
    }

    setIsProcessingAnamnesis(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-anamnesis', {
        body: { rawText: formData.presentIllness }
      });

      if (error) throw error;

      if (data?.success && data?.improvedText) {
        setFormData(prev => ({
          ...prev,
          presentIllness: data.improvedText
        }));

        toast.success("Anamnesis mejorada con IA");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo procesar la anamnesis");
    } finally {
      setIsProcessingAnamnesis(false);
    }
  };

  const handleDiagnosisKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && diagnosisInput.trim()) {
      e.preventDefault();
      setFormData(prev => ({
        ...prev,
        diagnoses: [...prev.diagnoses, diagnosisInput.trim()]
      }));
      setDiagnosisInput("");
    }
  };

  const removeDiagnosis = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnoses: prev.diagnoses.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const oxygenRequirement = formData.oxygenType
        ? {
            type: formData.oxygenType,
            flow: formData.oxygenFlow,
            peep: formData.oxygenPeep || null,
            fio2: formData.oxygenFio2 || null,
          }
        : null;

      const diet = formData.dietType
        ? {
            type: formData.dietType,
            notes: formData.dietNotes || null,
          }
        : null;

      const ivTherapy = formData.ivTherapyActive
        ? {
            active: true,
            type: formData.ivTherapyType || null,
            percentage: formData.ivTherapyPercentage,
          }
        : null;

      const { error } = await supabase
        .from("admissions")
        .update({
          admission_diagnoses: formData.diagnoses,
          present_illness: formData.presentIllness || null,
          personal_history: formData.personalHistory || null,
          family_history: formData.familyHistory || null,
          allergies: formData.allergies || null,
          physical_exam: formData.physicalExam || null,
          lab_results: formData.labResults || null,
          imaging_results: formData.imagingResults || null,
          oxygen_requirement: oxygenRequirement,
          respiratory_score: formData.respiratoryScore || null,
          viral_panel: formData.viralPanel || null,
          pending_tasks: formData.pendingTasks || null,
          current_medications: formData.medications || null,
          diet: diet,
          iv_therapy: ivTherapy,
          treatment_plan: formData.treatmentPlan || null,
          nursing_orders: formData.nursingOrders || null,
        })
        .eq("id", admissionId);

      if (error) throw error;

      toast.success("Datos actualizados correctamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating admission:", error);
      toast.error("Error al actualizar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const patientAge = patientData?.date_of_birth 
    ? Math.floor((new Date().getTime() - new Date(patientData.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 24;
  
  const hasOxygen = !!formData.oxygenType && formData.oxygenType !== "Ambiental";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AllergyAlert allergies={formData.allergies} />
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="clinical">Clínica</TabsTrigger>
          <TabsTrigger value="exams">Exámenes</TabsTrigger>
          <TabsTrigger value="treatment">Tratamiento</TabsTrigger>
          <TabsTrigger value="calculations">Cálculos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {/* Upload DAU */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Cargar DAU (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center hover:border-primary/40 transition-colors">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleDAUUpload}
                  className="hidden"
                  id="dau-upload"
                  disabled={isExtractingDAU}
                />
                <Label htmlFor="dau-upload" className="cursor-pointer">
                  {isExtractingDAU ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Extrayendo datos del DAU...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-10 w-10 text-primary" />
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

          {/* Protocol Templates */}
          <ProtocolTemplateSelector 
            onApplyTemplate={(templateData) => {
              setFormData(prev => ({
                ...prev,
                presentIllness: templateData.present_illness || prev.presentIllness,
                physicalExam: templateData.physical_exam || prev.physicalExam,
                labResults: templateData.lab_orders || prev.labResults,
                medications: templateData.medications || prev.medications,
                nursingOrders: templateData.nursing_orders || prev.nursingOrders,
              }));
            }}
          />

          {/* Anamnesis */}
          <Card>
            <CardHeader>
              <CardTitle>Anamnesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Anamnesis Próxima</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleProcessAnamnesis}
                    disabled={isProcessingAnamnesis || !formData.presentIllness}
                  >
                    {isProcessingAnamnesis ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Mejorar con IA
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={formData.presentIllness}
                  onChange={(e) => setFormData({ ...formData, presentIllness: e.target.value })}
                  rows={8}
                  placeholder="Describe la historia del cuadro actual. La IA reorganizará el texto de forma cronológica y corregirá errores."
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
                <Label>Antecedentes Familiares</Label>
                <Textarea
                  value={formData.familyHistory}
                  onChange={(e) => setFormData({ ...formData, familyHistory: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Alergias</Label>
                <Input
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Ej: No refiere, Penicilina, etc."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-4">
          {/* Diagnoses */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnósticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CIE10Search
                selectedDiagnoses={formData.diagnoses}
                onDiagnosesChange={(diagnoses) => setFormData({ ...formData, diagnoses })}
              />
            </CardContent>
          </Card>

          {/* Physical Exam */}
          <PhysicalExamForm
            value={formData.physicalExam}
            onChange={(value) => setFormData({ ...formData, physicalExam: value })}
          />

          {/* Oxygen Therapy */}
          <Card>
            <CardHeader>
              <CardTitle>Oxigenoterapia</CardTitle>
            </CardHeader>
            <CardContent>
              <OxygenTherapySelector
                value={{
                  type: formData.oxygenType,
                  flow: formData.oxygenFlow,
                  peep: formData.oxygenPeep,
                  fio2: formData.oxygenFio2,
                }}
                onChange={(oxygenData) => {
                  setFormData({
                    ...formData,
                    oxygenType: oxygenData.type,
                    oxygenFlow: oxygenData.flow,
                    oxygenPeep: oxygenData.peep || "",
                    oxygenFio2: oxygenData.fio2 || "",
                  });
                }}
              />
            </CardContent>
          </Card>

          {/* Respiratory Score */}
          <Card>
            <CardHeader>
              <CardTitle>Score Respiratorio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Score</Label>
                <Select
                  value={formData.respiratoryScore}
                  onValueChange={(value) => setFormData({ ...formData, respiratoryScore: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No aplica">No aplica</SelectItem>
                    <SelectItem value="TAL">TAL</SelectItem>
                    <SelectItem value="Pulmonary">Pulmonary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(formData.respiratoryScore === "TAL" || formData.respiratoryScore === "Pulmonary") && (
                <ScoreSelector 
                  scoreType={formData.respiratoryScore as "TAL" | "Pulmonary"}
                  patientAge={patientAge}
                  hasSupplementalOxygen={hasOxygen}
                  onScoreCalculated={(result) => {
                    console.log("Score calculado:", result);
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Viral Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Panel Respiratorio</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.viralPanel}
                onValueChange={(value) => setFormData({ ...formData, viralPanel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="VRS positivo">VRS (Virus Respiratorio Sincicial) +</SelectItem>
                  <SelectItem value="Influenza A positivo">Influenza A +</SelectItem>
                  <SelectItem value="Influenza B positivo">Influenza B +</SelectItem>
                  <SelectItem value="Adenovirus positivo">Adenovirus +</SelectItem>
                  <SelectItem value="Parainfluenza positivo">Parainfluenza +</SelectItem>
                  <SelectItem value="Metapneumovirus positivo">Metapneumovirus +</SelectItem>
                  <SelectItem value="Rinovirus positivo">Rinovirus +</SelectItem>
                  <SelectItem value="SARS-CoV-2 positivo">SARS-CoV-2 (COVID-19) +</SelectItem>
                  <SelectItem value="Neumococo positivo">Neumococo +</SelectItem>
                  <SelectItem value="H. influenzae positivo">H. influenzae +</SelectItem>
                  <SelectItem value="M. pneumoniae positivo">M. pneumoniae +</SelectItem>
                  <SelectItem value="Panel negativo">Panel Negativo</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          {/* Lab Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Exámenes de Laboratorio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-colors">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleLabUpload}
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
                rows={8}
                placeholder="- 06/10/25 SU HRR: Glucosa 111 LDH 383// CK total 31 CK-MB 14 // Crea 0.35 BUN 9.6..."
              />
            </CardContent>
          </Card>

          {/* Imaging */}
          <Card>
            <CardHeader>
              <CardTitle>Imagenología</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.imagingResults}
                onChange={(e) => setFormData({ ...formData, imagingResults: e.target.value })}
                rows={4}
                placeholder="Rx tórax, ECO, etc..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatment" className="space-y-4">
          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle>Medicamentos y Antibióticos</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="Ej: Ampicilina (100mg/kg/día), Salbutamol, Paracetamol"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Diet */}
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle>Alimentación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Régimen</Label>
                <Select
                  value={formData.dietType}
                  onValueChange={(value) => setFormData({ ...formData, dietType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar régimen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Régimen cero">Régimen cero (NPO)</SelectItem>
                    <SelectItem value="Régimen común">Régimen común</SelectItem>
                    <SelectItem value="Régimen liviano">Régimen liviano</SelectItem>
                    <SelectItem value="Selectividad alimentaria">Selectividad alimentaria</SelectItem>
                    <SelectItem value="Sin gluten">Sin gluten (Celiaquía)</SelectItem>
                    <SelectItem value="Sin lactosa">Sin lactosa</SelectItem>
                    <SelectItem value="Sin APLV">Sin proteínas leche vaca (APLV)</SelectItem>
                    <SelectItem value="Fórmula elemental">Fórmula elemental</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notas sobre Alimentación</Label>
                <Textarea
                  value={formData.dietNotes}
                  onChange={(e) => setFormData({ ...formData, dietNotes: e.target.value })}
                  placeholder="Ej: Aceptación 50%, necesita estímulo"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Nursing Orders */}
          <PediatricOrdersForm
            value={formData.nursingOrders}
            onChange={(value) => setFormData({ ...formData, nursingOrders: value })}
            patientWeight={patientData?.weight_kg}
            patientHeight={patientData?.height_cm}
          />

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Tareas Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.pendingTasks}
                onChange={(e) => setFormData({ ...formData, pendingTasks: e.target.value })}
                placeholder="Ej: Control de hemograma, Evaluación por cirugía"
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculations" className="space-y-4">
          {/* Fluid Therapy Calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de Fluidoterapia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientData?.weight_kg && patientData?.height_cm ? (
                <FluidTherapyCalculator
                  initialWeight={patientData.weight_kg}
                  initialHeight={patientData.height_cm}
                />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Ingrese peso y talla del paciente para calcular fluidoterapia
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}

