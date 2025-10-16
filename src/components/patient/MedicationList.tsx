import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Pill, Calendar, Clock, Search, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MedicationStatus = 'active' | 'completed' | 'stopped' | 'on-hold';
type DosageUnit = 'mg' | 'mcg' | 'g' | 'mL' | 'drops' | 'puffs' | 'units' | 'other';
type Frequency = 'QD' | 'BID' | 'TID' | 'QID' | 'QHS' | 'Q4H' | 'Q6H' | 'Q8H' | 'Q12H' | 'Q24H' | 'PRN' | 'Other';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  dosageUnit: DosageUnit;
  frequency: Frequency;
  route: string;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  prescribedBy?: string;
  instructions?: string;
  reason?: string;
  notes?: string;
}

interface MedicationListProps {
  medications: Medication[];
  onAddMedication: (medication: Omit<Medication, 'id'>) => void;
  onUpdateMedication: (id: string, updates: Partial<Medication>) => void;
  onDeleteMedication: (id: string) => void;
  className?: string;
}

const frequencyOptions: { value: Frequency; label: string; description: string }[] = [
  { value: 'QD', label: 'Una vez al día', description: 'Cada 24 horas' },
  { value: 'BID', label: 'Dos veces al día', description: 'Cada 12 horas' },
  { value: 'TID', label: 'Tres veces al día', description: 'Cada 8 horas' },
  { value: 'QID', label: 'Cuatro veces al día', description: 'Cada 6 horas' },
  { value: 'QHS', label: 'A la hora de dormir', description: 'Antes de acostarse' },
  { value: 'Q4H', label: 'Cada 4 horas', description: 'Cada 4 horas' },
  { value: 'Q6H', label: 'Cada 6 horas', description: 'Cada 6 horas' },
  { value: 'Q8H', label: 'Cada 8 horas', description: 'Cada 8 horas' },
  { value: 'Q12H', label: 'Cada 12 horas', description: 'Cada 12 horas' },
  { value: 'Q24H', label: 'Cada 24 horas', description: 'Cada 24 horas' },
  { value: 'PRN', label: 'Según sea necesario', description: 'Cuando sea necesario' },
  { value: 'Other', label: 'Otro', description: 'Frecuencia personalizada' },
];

const dosageUnitOptions: { value: DosageUnit; label: string }[] = [
  { value: 'mg', label: 'mg' },
  { value: 'mcg', label: 'mcg' },
  { value: 'g', label: 'g' },
  { value: 'mL', label: 'mL' },
  { value: 'drops', label: 'gotas' },
  { value: 'puffs', label: 'inhalaciones' },
  { value: 'units', label: 'unidades' },
  { value: 'other', label: 'otro' },
];

const routeOptions = [
  'Oral', 'Sublingual', 'Tópico', 'Ótico', 'Oftálmico', 'Nasal',
  'Inhalado', 'Intramuscular', 'Subcutáneo', 'Intravenoso', 'Rectal', 'Vaginal'
];

const statusOptions = [
  { value: 'active' as const, label: 'Activo', color: 'bg-green-100 text-green-800' },
  { value: 'completed' as const, label: 'Completado', color: 'bg-blue-100 text-blue-800' },
  { value: 'stopped' as const, label: 'Suspendido', color: 'bg-red-100 text-red-800' },
  { value: 'on-hold' as const, label: 'En pausa', color: 'bg-yellow-100 text-yellow-800' },
];

const MedicationList: React.FC<MedicationListProps> = ({
  medications = [],
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  className = '',
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState<Omit<Medication, 'id'>>({
    name: '',
    dosage: '',
    dosageUnit: 'mg',
    frequency: 'BID',
    route: 'Oral',
    startDate: new Date().toISOString().split('T')[0],
    status: 'active',
    instructions: '',
    reason: '',
    notes: '',
  });

  const filteredMedications = medications.filter(medication =>
    medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medication.instructions && medication.instructions.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status: string) => {
    const newStatus = status as MedicationStatus;
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      endDate: newStatus === 'completed' || newStatus === 'stopped' 
        ? new Date().toISOString().split('T')[0] 
        : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMedication) {
      onUpdateMedication(editingMedication.id, formData);
    } else {
      onAddMedication(formData);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      dosageUnit: 'mg',
      frequency: 'BID',
      route: 'Oral',
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      instructions: '',
      reason: '',
      notes: '',
    });
    setEditingMedication(null);
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      dosageUnit: medication.dosageUnit,
      frequency: medication.frequency,
      route: medication.route,
      startDate: medication.startDate,
      endDate: medication.endDate || '',
      status: medication.status,
      prescribedBy: medication.prescribedBy,
      instructions: medication.instructions || '',
      reason: medication.reason || '',
      notes: medication.notes || '',
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: MedicationStatus) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo?.color}`}>
        {statusInfo?.label}
      </span>
    );
  };

  const getFrequencyLabel = (frequency: Frequency) => {
    const freq = frequencyOptions.find(f => f.value === frequency);
    return freq ? freq.label : frequency;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Medicación</CardTitle>
            <CardDescription>Registro de medicamentos recetados</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar medicamentos..."
                className="pl-8 sm:w-[200px] md:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMedications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? (
              <p>No se encontraron medicamentos que coincidan con "{searchTerm}"</p>
            ) : (
              <p>No hay medicamentos registrados. Haz clic en Agregar para comenzar.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMedications.map((medication) => (
              <div key={medication.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-lg">
                        {medication.name}
                      </h4>
                      {getStatusBadge(medication.status)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Pill className="h-4 w-4 mr-1" />
                        {medication.dosage} {medication.dosageUnit}
                      </div>
                      <span>•</span>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {getFrequencyLabel(medication.frequency)}
                      </div>
                      <span>•</span>
                      <div className="text-muted-foreground">
                        Vía: {medication.route}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Inicio: {new Date(medication.startDate).toLocaleDateString()}
                      </div>
                      {medication.endDate && (
                        <>
                          <span>•</span>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Fin: {new Date(medication.endDate).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {medication.instructions && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Instrucciones:</p>
                        <p className="text-sm text-muted-foreground">{medication.instructions}</p>
                      </div>
                    )}
                    
                    {medication.reason && (
                      <div className="mt-1">
                        <p className="text-sm font-medium">Indicación:</p>
                        <p className="text-sm text-muted-foreground">{medication.reason}</p>
                      </div>
                    )}
                    
                    {medication.notes && (
                      <div className="mt-1">
                        <p className="text-sm font-medium">Notas:</p>
                        <p className="text-sm text-muted-foreground">{medication.notes}</p>
                      </div>
                    )}
                    
                    {medication.prescribedBy && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Recetado por: {medication.prescribedBy}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(medication)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteMedication(medication.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Diálogo para agregar/editar medicación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMedication ? 'Editar medicamento' : 'Agregar nuevo medicamento'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Medicamento *
                </Label>
                <Input
                  id="name"
                  name="name"
                  className="col-span-3"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Paracetamol, Ibuprofeno..."
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dosage" className="text-right">
                  Dosis *
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="dosage"
                    name="dosage"
                    type="number"
                    step="0.01"
                    className="w-24"
                    required
                    value={formData.dosage}
                    onChange={handleInputChange}
                    placeholder="500"
                  />
                  <Select
                    value={formData.dosageUnit}
                    onValueChange={(value) => handleSelectChange('dosageUnit', value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {dosageUnitOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  Frecuencia *
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => handleSelectChange('frequency', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="route" className="text-right">
                  Vía de administración
                </Label>
                <Select
                  value={formData.route}
                  onValueChange={(value) => handleSelectChange('route', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar vía" />
                  </SelectTrigger>
                  <SelectContent>
                    {routeOptions.map((route) => (
                      <SelectItem key={route} value={route}>
                        {route}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Estado
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${option.color.replace('bg-', 'bg-opacity-100 ')}`}></span>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Fecha de inicio
                </Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="col-span-3"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              
              {(formData.status === 'completed' || formData.status === 'stopped') && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endDate" className="text-right">
                    Fecha de término
                  </Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    className="col-span-3"
                    value={formData.endDate || ''}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="instructions" className="text-right mt-2">
                  Instrucciones
                </Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  className="col-span-3"
                  rows={2}
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Ej: Tomar con alimentos, Evitar el alcohol, etc."
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="reason" className="text-right mt-2">
                  Indicación
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  className="col-span-3"
                  rows={2}
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Motivo o diagnóstico por el que se receta"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right mt-2">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  className="col-span-3"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Otras observaciones importantes"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prescribedBy" className="text-right">
                  Recetado por
                </Label>
                <Input
                  id="prescribedBy"
                  name="prescribedBy"
                  className="col-span-3"
                  value={formData.prescribedBy || ''}
                  onChange={handleInputChange}
                  placeholder="Nombre del profesional que receta"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingMedication ? 'Actualizar' : 'Agregar'} medicamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MedicationList;
