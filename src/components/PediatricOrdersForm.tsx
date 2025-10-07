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
  nursingCareOptions,
  commonMedications,
  kineOptions,
  generateOrdersText,
  type MedicalOrder,
} from "@/utils/pediatricOrders";

interface PediatricOrdersFormProps {
  value: string;
  onChange: (value: string) => void;
  patientWeight?: number;
}

export function PediatricOrdersForm({ value, onChange, patientWeight }: PediatricOrdersFormProps) {
  const [orders, setOrders] = useState<MedicalOrder>({
    position: "",
    regimen: "",
    customRegimen: "",
    nursingCare: ["csv-6", "vvp", "curva-febril"],
    medications: [],
    exams: "",
    interconsults: "",
    kine: "",
    observations: "Avisar eventualidad al residente",
  });

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

  const handleNursingCareToggle = (careValue: string) => {
    const newCare = orders.nursingCare.includes(careValue)
      ? orders.nursingCare.filter(c => c !== careValue)
      : [...orders.nursingCare, careValue];
    updateOrders({ nursingCare: newCare });
  };

  const handleAddMedication = () => {
    if (!selectedMedication) return;

    const med = commonMedications.find(m => m.name === selectedMedication);
    if (!med) return;

    const dosage = medicationDetails.dosage || 
      (med.dosageCalc && patientWeight ? `${med.dosageCalc(patientWeight)} mg` : med.dosage?.[0] || "");

    const newMed = {
      name: med.name,
      dosage,
      route: medicationDetails.route || med.routes[0],
      frequency: medicationDetails.frequency || med.frequency[0],
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

        {/* Nursing Care */}
        <div>
          <Label>3. Cuidados de Enfermería</Label>
          <div className="space-y-2 mt-2">
            {nursingCareOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={orders.nursingCare.includes(option.value)}
                  onCheckedChange={() => handleNursingCareToggle(option.value)}
                />
                <label
                  htmlFor={option.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Medications */}
        <div>
          <Label>4. Medicamentos</Label>
          
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Dosis</Label>
                  <Input
                    placeholder={
                      selectedMedInfo.dosageCalc && patientWeight
                        ? `${selectedMedInfo.dosageCalc(patientWeight)} mg`
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
          <Label>5. Exámenes</Label>
          <Input
            placeholder="Ej: Pendiente panel viral, GSV + ELP..."
            value={orders.exams}
            onChange={(e) => updateOrders({ exams: e.target.value })}
          />
        </div>

        {/* Interconsults */}
        <div>
          <Label>6. Interconsultas</Label>
          <Input
            placeholder="Ej: Cardiología, Neurología... o (-) si no aplica"
            value={orders.interconsults}
            onChange={(e) => updateOrders({ interconsults: e.target.value })}
          />
        </div>

        {/* Kine */}
        <div>
          <Label>7. Kinesiología</Label>
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
          <Label>8. Observaciones</Label>
          <Textarea
            rows={2}
            value={orders.observations}
            onChange={(e) => updateOrders({ observations: e.target.value })}
          />
        </div>

        {/* Preview */}
        <div className="p-3 bg-muted/30 rounded-lg">
          <Label className="text-xs text-muted-foreground">Vista Previa</Label>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{value || "Las indicaciones se generarán automáticamente..."}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
