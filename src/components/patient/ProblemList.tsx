import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, CheckCircle, AlertCircle, Clock, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ProblemStatus = 'active' | 'resolved' | 'inactive';

export interface Problem {
  id: string;
  code?: string;
  description: string;
  status: ProblemStatus;
  onsetDate: string;
  resolvedDate?: string;
  notes?: string;
  category?: string;
}

interface ProblemListProps {
  problems: Problem[];
  onAddProblem: (problem: Omit<Problem, 'id'>) => void;
  onUpdateProblem: (id: string, updates: Partial<Problem>) => void;
  onDeleteProblem: (id: string) => void;
  className?: string;
}

const statusOptions = [
  { value: 'active', label: 'Activo', icon: AlertCircle },
  { value: 'resolved', label: 'Resuelto', icon: CheckCircle },
  { value: 'inactive', label: 'Inactivo', icon: Clock },
];

const ProblemList: React.FC<ProblemListProps> = ({
  problems = [],
  onAddProblem,
  onUpdateProblem,
  onDeleteProblem,
  className = '',
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [formData, setFormData] = useState<Omit<Problem, 'id'>>({
    code: '',
    description: '',
    status: 'active',
    onsetDate: new Date().toISOString().split('T')[0],
    notes: '',
    category: '',
  });

  const filteredProblems = problems.filter(problem =>
    problem.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (problem.code && problem.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({
      ...prev,
      status: status as ProblemStatus,
      resolvedDate: status === 'resolved' ? new Date().toISOString().split('T')[0] : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProblem) {
      onUpdateProblem(editingProblem.id, formData);
    } else {
      onAddProblem(formData);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      status: 'active',
      onsetDate: new Date().toISOString().split('T')[0],
      notes: '',
      category: '',
    });
    setEditingProblem(null);
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    setFormData({
      code: problem.code || '',
      description: problem.description,
      status: problem.status,
      onsetDate: problem.onsetDate,
      resolvedDate: problem.resolvedDate || '',
      notes: problem.notes || '',
      category: problem.category || '',
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: ProblemStatus) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    const Icon = statusInfo?.icon || AlertCircle;
    
    return (
      <Badge 
        variant={status === 'active' ? 'destructive' : status === 'resolved' ? 'default' : 'secondary'}
        className="inline-flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {status === 'active' ? 'Activo' : status === 'resolved' ? 'Resuelto' : 'Inactivo'}
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Problemas de salud</CardTitle>
            <CardDescription>Lista de diagnósticos y problemas de salud</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar problemas..."
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
        {filteredProblems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? (
              <p>No se encontraron problemas que coincidan con "{searchTerm}"</p>
            ) : (
              <p>No hay problemas registrados. Haz clic en Agregar para comenzar.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProblems.map((problem) => (
              <div key={problem.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {problem.code && <span className="text-muted-foreground">{problem.code}: </span>}
                        {problem.description}
                      </h4>
                      {getStatusBadge(problem.status)}
                    </div>
                    {problem.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {problem.category}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Inicio: {new Date(problem.onsetDate).toLocaleDateString()}
                      {problem.resolvedDate && (
                        <span> • Resuelto: {new Date(problem.resolvedDate).toLocaleDateString()}</span>
                      )}
                    </p>
                    {problem.notes && (
                      <p className="text-sm mt-2 text-muted-foreground">{problem.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(problem)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteProblem(problem.id)}
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

      {/* Diálogo para agregar/editar problemas */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProblem ? 'Editar problema' : 'Agregar nuevo problema'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Código CIE-10
                </Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="Ej: E11.65"
                  className="col-span-3"
                  value={formData.code}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción *
                </Label>
                <Input
                  id="description"
                  name="description"
                  className="col-span-3"
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                />
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
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="onsetDate" className="text-right">
                  Fecha de inicio
                </Label>
                <Input
                  id="onsetDate"
                  name="onsetDate"
                  type="date"
                  className="col-span-3"
                  value={formData.onsetDate}
                  onChange={handleInputChange}
                />
              </div>
              
              {formData.status === 'resolved' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="resolvedDate" className="text-right">
                    Fecha de resolución
                  </Label>
                  <Input
                    id="resolvedDate"
                    name="resolvedDate"
                    type="date"
                    className="col-span-3"
                    value={formData.resolvedDate || new Date().toISOString().split('T')[0]}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right mt-2">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  className="col-span-3"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
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
                {editingProblem ? 'Actualizar' : 'Agregar'} problema
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProblemList;
