import { useState, useMemo } from 'react';
import { usePrescription, type PrescriptionMedication, type MedicationInteraction } from '@/hooks/usePrescription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, X, Pill, Syringe, Stethoscope, AlertTriangle, Info, Search, FileText, Calculator, CheckCircle2 
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function PrescriptionForm() {
  const { toast } = useToast();
  const {
    // State
    selectedMeds,
    patientWeight,
    diagnosis,
    diagnosisDescription,
    interactions,
    hasSevereInteraction,
    medications,
    diagnosisTemplates,
    
    // Actions
    setPatientWeight,
    setDiagnosis,
    setDiagnosisDescription,
    calculateDose,
    applyTemplate,
    addMedication,
    removeMedication,
    updateMedication,
    clearPrescription
  } = usePrescription();

  const [activeTab, setActiveTab] = useState('prescription');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Filtrar medicamentos por término de búsqueda
  const filteredMeds = useMemo(() => {
    if (!searchTerm) return [];
    return medications.filter(med => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.commonDosage?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5); // Mostrar solo los primeros 5 resultados
  }, [searchTerm, medications]);

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMeds.length === 0) {
      toast({
        title: 'Error',
        description: 'Debe agregar al menos un medicamento a la prescripción.',
        variant: 'destructive'
      });
      return;
    }
    
    if (hasSevereInteraction) {
      toast({
        title: 'Advertencia',
        description: 'Existen interacciones graves entre los medicamentos seleccionados.',
        variant: 'destructive'
      });
      return;
    }
    
    // Aquí iría la lógica para guardar la prescripción
    console.log('Prescripción guardada:', {
      diagnosis,
      diagnosisDescription,
      patientWeight,
      medications: selectedMeds
    });
    
    toast({
      title: 'Prescripción guardada',
      description: 'La prescripción se ha guardado correctamente.',
    });
    
    // Limpiar el formulario
    clearPrescription();
  };

  // Formatear dosis para mostrar
  const formatDosage = (med: PrescriptionMedication) => {
    if (med.calculatedDose <= 0) return 'Ingrese peso del paciente';
    
    let dosage = `${med.calculatedDose} mg`;
    if (med.maxDose && med.calculatedDose >= med.maxDose) {
      dosage += ` (dosis máxima: ${med.maxDose} mg)`;
    }
    return dosage;
  };

  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            Asistente de Prescripción
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete los datos del paciente y los medicamentos a prescribir
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowTemplateSelector(!showTemplateSelector)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {showTemplateSelector ? 'Ocultar plantillas' : 'Usar plantilla'}
        </Button>
      </div>

      {/* Selector de plantillas */}
      {showTemplateSelector && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Plantillas de diagnóstico
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Seleccione una plantilla para cargar medicamentos predefinidos
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {diagnosisTemplates.map(template => (
                <div 
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    applyTemplate(template.id);
                    setShowTemplateSelector(false);
                  }}
                >
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">{template.diagnosisCode}</p>
                  <p className="text-sm mt-2 line-clamp-2">{template.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {template.medications.map(medId => {
                      const med = medications.find(m => m.id === medId);
                      return med ? (
                        <Badge key={medId} variant="secondary" className="text-xs">
                          {med.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="prescription">
            <Pill className="h-4 w-4 mr-2" />
            Prescripción
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Calculadora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prescription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Datos del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <div className="relative">
                    <Input
                      id="weight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={patientWeight || ''}
                      onChange={(e) => setPatientWeight(e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Ej: 12.5"
                      className="pr-10"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      kg
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Código CIE-10</Label>
                  <Input
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Ej: J18.9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosisDesc">Descripción</Label>
                  <Input
                    id="diagnosisDesc"
                    value={diagnosisDescription}
                    onChange={(e) => setDiagnosisDescription(e.target.value)}
                    placeholder="Diagnóstico clínico"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicamentos
                </div>
                <span className="text-sm font-normal text-muted-foreground">
                  {selectedMeds.length} medicamento{selectedMeds.length !== 1 ? 's' : ''}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Agregar medicamento</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar medicamento..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => setSearchTerm(searchTerm || ' ')}
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="absolute z-10 mt-1 w-full bg-popover shadow-lg rounded-md border">
                      {filteredMeds.length > 0 ? (
                        <div className="py-1">
                          {filteredMeds.map((med) => (
                            <div
                              key={med.id}
                              className="px-4 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                              onClick={() => {
                                addMedication(med.id);
                                setSearchTerm('');
                              }}
                            >
                              <div>
                                <div className="font-medium">{med.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {med.commonDosage} • {med.route}
                                </div>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      ) : searchTerm.trim() !== '' ? (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                          No se encontraron medicamentos
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {selectedMeds.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Pill className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <h3 className="font-medium">No hay medicamentos agregados</h3>
                    <p className="text-sm text-muted-foreground">
                      Busque y agregue medicamentos para comenzar
                    </p>
                  </div>
                ) : (
                  selectedMeds.map((med) => (
                    <Card key={med.id} className="overflow-hidden">
                      <CardHeader className="pb-2 bg-muted/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{med.name}</CardTitle>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="secondary">{med.route}</Badge>
                              <Badge variant="secondary">{med.frequency}</Badge>
                              {med.commonDosage && (
                                <Badge variant="outline">{med.commonDosage}</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeMedication(med.id)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Eliminar medicamento</span>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Dosis calculada</Label>
                            <div className="p-3 border rounded-md bg-background">
                              <div className="text-lg font-medium">
                                {formatDosage(med)}
                              </div>
                              {patientWeight && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {med.minDoseMgKg ? `${med.minDoseMgKg} mg/kg × ${patientWeight} kg` : 'Dosis estándar'}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`frequency-${med.id}`}>Frecuencia</Label>
                            <Select
                              value={med.frequency}
                              onValueChange={(value) => 
                                updateMedication(med.id, { frequency: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar frecuencia" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cada 6 horas">Cada 6 horas</SelectItem>
                                <SelectItem value="Cada 8 horas">Cada 8 horas</SelectItem>
                                <SelectItem value="Cada 12 horas">Cada 12 horas</SelectItem>
                                <SelectItem value="1 vez al día">1 vez al día</SelectItem>
                                <SelectItem value="2 veces al día">2 veces al día</SelectItem>
                                <SelectItem value="3 veces al día">3 veces al día</SelectItem>
                                <SelectItem value="4 veces al día">4 veces al día</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`duration-${med.id}`}>Duración (días)</Label>
                            <Input
                              id={`duration-${med.id}`}
                              type="number"
                              min="1"
                              value={med.duration}
                              onChange={(e) => 
                                updateMedication(med.id, { 
                                  duration: parseInt(e.target.value) || 1 
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`instructions-${med.id}`}>Instrucciones adicionales</Label>
                            <Textarea
                              id={`instructions-${med.id}`}
                              placeholder="Ej: Tomar con alimentos, evitar el sol, etc."
                              value={med.instructions}
                              onChange={(e) => 
                                updateMedication(med.id, { instructions: e.target.value })
                              }
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Interacciones medicamentosas */}
              {interactions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${hasSevereInteraction ? 'text-destructive' : 'text-yellow-500'}`} />
                    Interacciones medicamentosas
                  </h3>
                  <div className="space-y-2">
                    {interactions.map((interaction, idx) => (
                      <Alert 
                        key={idx} 
                        variant={interaction.severity === 'grave' ? 'destructive' : 'default'}
                        className="text-sm"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-2">
                          {interaction.medication1} + {interaction.medication2}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              interaction.severity === 'grave' 
                                ? 'border-destructive/50 text-destructive' 
                                : interaction.severity === 'moderada'
                                ? 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400'
                                : 'border-blue-500/50 text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {interaction.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-1">
                          {interaction.description}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                if (confirm('¿Está seguro de que desea limpiar el formulario?')) {
                  clearPrescription();
                }
              }}
              disabled={selectedMeds.length === 0}
            >
              Limpiar todo
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={selectedMeds.length === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Guardar prescripción
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Calculadora de dosis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso del paciente (kg)</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={patientWeight || ''}
                    onChange={(e) => setPatientWeight(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Ej: 12.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Medicamento</Label>
                  <Select
                    onValueChange={(medId) => {
                      const med = medications.find(m => m.id === medId);
                      if (med) {
                        addMedication(medId);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar medicamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {medications.map((med) => (
                        <SelectItem key={med.id} value={med.id}>
                          {med.name} {med.commonDosage && `(${med.commonDosage})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedMeds.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium">Resultados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedMeds.map((med) => {
                      const { dose } = calculateDose(med, patientWeight);
                      return (
                        <Card key={med.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{med.name}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground">Dosis calculada</p>
                                <p className="text-2xl font-bold">
                                  {dose > 0 ? `${dose.toFixed(2)} mg` : 'Ingrese peso'}
                                </p>
                              </div>
                              
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">Dosis por kg</p>
                                <p className="font-medium">
                                  {med.minDoseMgKg ? `${med.minDoseMgKg} - ${med.maxDoseMgKg || med.minDoseMgKg} mg/kg` : 'Dosis estándar'}
                                </p>
                              </div>
                              
                              {med.maxDoseMg && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm text-muted-foreground">Dosis máxima</p>
                                  <p className="font-medium">{med.maxDoseMg} mg</p>
                                </div>
                              )}
                              
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">Frecuencia</p>
                                <p className="font-medium">{med.frequency}</p>
                              </div>
                              
                              <div className="pt-2 border-t">
                                <p className="text-sm text-muted-foreground">Vía de administración</p>
                                <p className="font-medium">{med.route}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Info className="h-5 w-5" />
              Información importante
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-600 dark:text-blue-400 list-disc pl-5">
              <li>Las dosis son aproximadas y deben ser validadas por un profesional médico.</li>
              <li>Verifique siempre las contraindicaciones y ajuste según la condición del paciente.</li>
              <li>Considere la función renal y hepática para ajustes de dosis cuando sea necesario.</li>
              <li>Este es un sistema de apoyo a la decisión clínica, no reemplaza el juicio profesional.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
