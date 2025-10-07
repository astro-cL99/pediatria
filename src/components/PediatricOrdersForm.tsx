import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import {
  positionOptions,
  regimenOptions,
  nursingCareItems,
  frequencyOptions,
  vigilarOptions,
  commonMedications,
  kineOptions,
  generateOrdersText,
  calculateHollidayFluid,
  calculateBSA,
  calculateFluidByBSA,
  calculateIVFluidComposition,
  type MedicalOrder,
  type NursingCareItem,
  type IVFluidTherapy,
} from "@/utils/pediatricOrders";

interface PediatricOrdersFormProps {
  value: string;
  onChange: (value: string) => void;
  patientWeight?: number;
  patientHeight?: number;
}

export function PediatricOrdersForm({ value, onChange, patientWeight, patientHeight }: PediatricOrdersFormProps) {
  const [orders, setOrders] = useState<MedicalOrder>({
    position: "",
    regimen: "",
    customRegimen: "",
    nursingCare: [
      { item: "csv", frequency: "6h" },
      { item: "vvp" },
      { item: "curva-febril" },
    ],
    medications: [],
    exams: "",
    interconsults: "",
    kine: "",
    observations: "Avisar eventualidad al residente",
  });

  const [selectedNursingItem, setSelectedNursingItem] = useState("");
  const [nursingFrequency, setNursingFrequency] = useState("");
  const [nursingDetails, setNursingDetails] = useState("");

  const [selectedMedication, setSelectedMedication] = useState("");
  const [medicationDetails, setMedicationDetails] = useState({
    dosage: "",
    route: "",
    frequency: "",
    indication: "",
  });

  const updateOrders = (newOrders: Partial<MedicalOrder>) => {
    const updated = { ...orders, ...newOrders };
    setOrders(updated);
    onChange(generateOrdersText(updated, patientWeight));
  };

  const handleAddNursingCare = () => {
    if (!selectedNursingItem) return;
    
    const newCare: NursingCareItem = {
      item: selectedNursingItem,
      frequency: nursingFrequency || undefined,
      details: nursingDetails || undefined,
    };
    
    updateOrders({ nursingCare: [...orders.nursingCare, newCare] });
    setSelectedNursingItem("");
    setNursingFrequency("");
    setNursingDetails("");
  };

  const handleRemoveNursingCare = (index: number) => {
    const newCare = orders.nursingCare.filter((_, i) => i !== index);
    updateOrders({ nursingCare: newCare });
  };

  // Hydration calculations
  const hollidayFluid = patientWeight ? calculateHollidayFluid(patientWeight) : null;
  const bsa = patientWeight && patientHeight ? calculateBSA(patientHeight, patientWeight) : null;
  const fluidByBSA = bsa ? calculateFluidByBSA(bsa) : null;

  const ivComposition = orders.ivFluidTherapy ? calculateIVFluidComposition(orders.ivFluidTherapy) : null;

  const handleAddMedication = () => {
    if (!selectedMedication) return;

    const med = commonMedications.find(m => m.name === selectedMedication);
    if (!med) return;

    let dosage = medicationDetails.dosage;
    if (!dosage && med.dosageCalc && patientWeight) {
      const result = med.dosageCalc(patientWeight);
      dosage = typeof result === 'number' ? `${result} mg` : result.dose;
    }
    if (!dosage && med.dosage?.[0]) {
      dosage = med.dosage[0];
    }
    dosage = dosage || "";

    const newMed = {
      name: med.name,
      dosage,
      route: medicationDetails.route || med.routes[0],
      frequency: medicationDetails.frequency || med.frequency?.[0] || "",
      indication: medicationDetails.indication || med.indication || "",
    };

    updateOrders({ medications: [...orders.medications, newMed] });
    
    // Reset
    setSelectedMedication("");
    setMedicationDetails({
      dosage: "",
      route: "",
      frequency: "",
      indication: "",
    });
  };

  const handleRemoveMedication = (index: number) => {
    const newMeds = orders.medications.filter((_, i) => i !== index);
    updateOrders({ medications: newMeds });
  };

  const selectedMedInfo = commonMedications.find(m => m.name === selectedMedication);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indicaciones Médicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position */}
        <div>
          <Label>1. Posición</Label>
          <Select value={orders.position} onValueChange={(value) => updateOrders({ position: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar posición..." />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {positionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Regimen */}
        <div>
          <Label>2. Régimen</Label>
          <Select value={orders.regimen} onValueChange={(value) => updateOrders({ regimen: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar régimen..." />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {regimenOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {orders.regimen === "custom" && (
            <Input
              className="mt-2"
              placeholder="Especificar régimen personalizado..."
              value={orders.customRegimen}
              onChange={(e) => updateOrders({ customRegimen: e.target.value })}
            />
          )}
        </div>

        {/* Hydration Requirements */}
        {(hollidayFluid || fluidByBSA) && (
          <div className="p-3 bg-primary/5 rounded-lg space-y-1">
            <Label className="text-xs font-semibold">Requerimientos Hídricos</Label>
            {hollidayFluid && (
              <p className="text-sm">Fórmula Holliday: <span className="font-semibold">{hollidayFluid} ml/día</span> ({Math.round(hollidayFluid / 24)} ml/h)</p>
            )}
            {fluidByBSA && bsa && (
              <p className="text-sm">Superficie Corporal (BSA {bsa.toFixed(2)} m²): <span className="font-semibold">{fluidByBSA.min}-{fluidByBSA.max} ml/día</span></p>
            )}
          </div>
        )}

        {/* IV Fluid Therapy */}
        <div>
          <Label>3. Fleboclisis / Sueroterapia</Label>
          <div className="space-y-3 mt-2 p-3 border border-primary/20 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Suero Glucosado</Label>
                <Select
                  value={orders.ivFluidTherapy?.glucoseConcentration || "5"}
                  onValueChange={(value: "2.5" | "5") => 
                    updateOrders({ 
                      ivFluidTherapy: { 
                        ...orders.ivFluidTherapy, 
                        glucoseConcentration: value,
                        baseVolume: orders.ivFluidTherapy?.baseVolume || 500,
                        naClVolume: orders.ivFluidTherapy?.naClVolume || 20,
                        kClVolume: orders.ivFluidTherapy?.kClVolume || 10,
                        rate: orders.ivFluidTherapy?.rate || 43,
                      } as IVFluidTherapy
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="2.5">2.5%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Volumen (ml)</Label>
                <Input
                  type="number"
                  value={orders.ivFluidTherapy?.baseVolume || 500}
                  onChange={(e) => 
                    updateOrders({ 
                      ivFluidTherapy: { 
                        ...orders.ivFluidTherapy,
                        baseVolume: parseInt(e.target.value) || 500,
                        glucoseConcentration: orders.ivFluidTherapy?.glucoseConcentration || "5",
                        naClVolume: orders.ivFluidTherapy?.naClVolume || 20,
                        kClVolume: orders.ivFluidTherapy?.kClVolume || 10,
                        rate: orders.ivFluidTherapy?.rate || 43,
                      } as IVFluidTherapy
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">NaCl 10% (ml)</Label>
                <Input
                  type="number"
                  value={orders.ivFluidTherapy?.naClVolume || 20}
                  onChange={(e) => 
                    updateOrders({ 
                      ivFluidTherapy: { 
                        ...orders.ivFluidTherapy,
                        naClVolume: parseInt(e.target.value) || 20,
                        glucoseConcentration: orders.ivFluidTherapy?.glucoseConcentration || "5",
                        baseVolume: orders.ivFluidTherapy?.baseVolume || 500,
                        kClVolume: orders.ivFluidTherapy?.kClVolume || 10,
                        rate: orders.ivFluidTherapy?.rate || 43,
                      } as IVFluidTherapy
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">KCl 10% (ml)</Label>
                <Input
                  type="number"
                  value={orders.ivFluidTherapy?.kClVolume || 10}
                  onChange={(e) => 
                    updateOrders({ 
                      ivFluidTherapy: { 
                        ...orders.ivFluidTherapy,
                        kClVolume: parseInt(e.target.value) || 10,
                        glucoseConcentration: orders.ivFluidTherapy?.glucoseConcentration || "5",
                        baseVolume: orders.ivFluidTherapy?.baseVolume || 500,
                        naClVolume: orders.ivFluidTherapy?.naClVolume || 20,
                        rate: orders.ivFluidTherapy?.rate || 43,
                      } as IVFluidTherapy
                    })
                  }
                />
              </div>
              <div className="col-span-2">
                <Label className="text-xs">Velocidad de infusión (ml/h)</Label>
                <Input
                  type="number"
                  value={orders.ivFluidTherapy?.rate || 43}
                  onChange={(e) => 
                    updateOrders({ 
                      ivFluidTherapy: { 
                        ...orders.ivFluidTherapy,
                        rate: parseInt(e.target.value) || 43,
                        glucoseConcentration: orders.ivFluidTherapy?.glucoseConcentration || "5",
                        baseVolume: orders.ivFluidTherapy?.baseVolume || 500,
                        naClVolume: orders.ivFluidTherapy?.naClVolume || 20,
                        kClVolume: orders.ivFluidTherapy?.kClVolume || 10,
                      } as IVFluidTherapy
                    })
                  }
                />
              </div>
            </div>
            
            {ivComposition && (
              <div className="p-2 bg-muted/30 rounded text-xs space-y-1">
                <p><strong>Composición total:</strong></p>
                <p>• Volumen: {ivComposition.totalVolume} ml ({ivComposition.volumePerDay} ml/día)</p>
                <p>• Glucosa: {ivComposition.glucoseGrams} g ({ivComposition.calories} kcal)</p>
                <p>• Sodio: {ivComposition.sodiumMEq} mEq</p>
                <p>• Potasio: {ivComposition.potassiumMEq} mEq</p>
              </div>
            )}
          </div>
        </div>

        {/* Nursing Care */}
        <div>
          <Label>4. Cuidados de Enfermería</Label>
          
          {/* Nursing care list */}
          {orders.nursingCare.length > 0 && (
            <div className="space-y-2 mb-3 p-3 bg-muted/30 rounded-lg">
              {orders.nursingCare.map((care, index) => {
                const item = nursingCareItems.find(n => n.value === care.item);
                const freq = care.frequency ? frequencyOptions.find(f => f.value === care.frequency) : null;
                return (
                  <div key={index} className="flex items-start justify-between text-sm">
                    <span>
                      {item?.label}
                      {freq && ` ${freq.label}`}
                      {care.details && ` (${care.details})`}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNursingCare(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add nursing care */}
          <div className="space-y-2 p-3 border border-primary/20 rounded-lg">
            <Select value={selectedNursingItem} onValueChange={setSelectedNursingItem}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cuidado..." />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {nursingCareItems.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedNursingItem && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Frecuencia (opcional)</Label>
                  <Select value={nursingFrequency} onValueChange={setNursingFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {frequencyOptions.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedNursingItem === "vigilar" && (
                  <div>
                    <Label className="text-xs">Detalles</Label>
                    <Input
                      placeholder="Ej: satO2, fiebre..."
                      value={nursingDetails}
                      onChange={(e) => setNursingDetails(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNursingCare}
              disabled={!selectedNursingItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cuidado
            </Button>
          </div>
        </div>

        {/* Medications */}
        <div>
          <Label>5. Medicamentos</Label>
          
          {/* Medication list */}
          {orders.medications.length > 0 && (
            <div className="space-y-2 mb-3 p-3 bg-muted/30 rounded-lg">
              {orders.medications.map((med, index) => (
                <div key={index} className="flex items-start justify-between text-sm">
                  <span>
                    {med.name} {med.dosage} {med.frequency} {med.route}
                    {med.indication && ` ${med.indication}`}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMedication(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add medication */}
          <div className="space-y-2 p-3 border border-primary/20 rounded-lg">
            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar medicamento..." />
              </SelectTrigger>
              <SelectContent className="bg-card z-50">
                {commonMedications.map(med => (
                  <SelectItem key={med.name} value={med.name}>
                    {med.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedMedInfo && (
              <>
                {selectedMedInfo.dosageCalc && patientWeight && (() => {
                  const result = selectedMedInfo.dosageCalc(patientWeight);
                  if (typeof result === 'number') {
                    return (
                      <div className="p-2 bg-primary/5 rounded text-xs">
                        <strong>Dosis calculada:</strong> {result} mg ({(result / patientWeight).toFixed(1)} mg/kg)
                      </div>
                    );
                  }
                  return (
                    <div className="p-2 bg-primary/5 rounded text-xs space-y-1">
                      <p><strong>Dosis:</strong> {result.dose}</p>
                      <p><strong>Frecuencia:</strong> {result.frequency}</p>
                      <p><strong>Dosis máxima:</strong> {result.maxDose}</p>
                      {result.dilution && <p><strong>Dilución:</strong> {result.dilution}</p>}
                      {result.infusionRate && <p><strong>Velocidad:</strong> {result.infusionRate}</p>}
                      {result.notes && <p className="text-amber-600"><strong>Nota:</strong> {result.notes}</p>}
                    </div>
                  );
                })()}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Dosis</Label>
                    <Input
                      placeholder={(() => {
                        if (selectedMedInfo.dosageCalc && patientWeight) {
                          const result = selectedMedInfo.dosageCalc(patientWeight);
                          return typeof result === 'number' ? `${result} mg` : result.dose;
                        }
                        return selectedMedInfo.dosage?.[0] || "Ej: 500 mg";
                          : selectedMedInfo.dosage?.[0] || "Dosis"
                      }
                      value={medicationDetails.dosage}
                      onChange={(e) => setMedicationDetails({ ...medicationDetails, dosage: e.target.value })}
                    />
                  </div>
                <div>
                  <Label className="text-xs">Vía</Label>
                  <Select
                    value={medicationDetails.route}
                    onValueChange={(value) => setMedicationDetails({ ...medicationDetails, route: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedMedInfo.routes[0]} />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {selectedMedInfo.routes.map(route => (
                        <SelectItem key={route} value={route}>
                          {route}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Frecuencia</Label>
                  <Select
                    value={medicationDetails.frequency}
                    onValueChange={(value) => setMedicationDetails({ ...medicationDetails, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedMedInfo.frequency[0]} />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      {selectedMedInfo.frequency.map(freq => (
                        <SelectItem key={freq} value={freq}>
                          {freq}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Indicación</Label>
                  <Input
                    placeholder={selectedMedInfo.indication || "Opcional"}
                    value={medicationDetails.indication}
                    onChange={(e) => setMedicationDetails({ ...medicationDetails, indication: e.target.value })}
                  />
                </div>
                </div>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMedication}
              disabled={!selectedMedication}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Medicamento
            </Button>
          </div>
        </div>

        {/* Exams */}
        <div>
          <Label>6. Exámenes</Label>
          <Input
            placeholder="Ej: Pendiente panel viral, GSV + ELP..."
            value={orders.exams}
            onChange={(e) => updateOrders({ exams: e.target.value })}
          />
        </div>

        {/* Interconsults */}
        <div>
          <Label>7. Interconsultas</Label>
          <Input
            placeholder="Ej: Cardiología, Neurología... o (-) si no aplica"
            value={orders.interconsults}
            onChange={(e) => updateOrders({ interconsults: e.target.value })}
          />
        </div>

        {/* Kine */}
        <div>
          <Label>8. Kinesiología</Label>
          <Select value={orders.kine} onValueChange={(value) => updateOrders({ kine: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              <SelectItem value="none">No requiere</SelectItem>
              {kineOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Observations */}
        <div>
          <Label>9. Observaciones</Label>
          <Textarea
            rows={2}
            value={orders.observations}
            onChange={(e) => updateOrders({ observations: e.target.value })}
          />
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs text-muted-foreground">Vista Previa</Label>
          <div className="text-xs mt-2 whitespace-pre-wrap">{value || "Las indicaciones se generarán automáticamente..."}</div>
        </div>
      </CardContent>
    </Card>
  );
}
