import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Download, SearchX } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format, differenceInYears } from "date-fns";

interface SearchFilters {
  name: string;
  rut: string;
  ageMin: string;
  ageMax: string;
  diagnosis: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  hasOxygen: boolean;
  hasAntibiotics: boolean;
}

export function AdvancedSearch() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    rut: '',
    ageMin: '',
    ageMax: '',
    diagnosis: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    hasOxygen: false,
    hasAntibiotics: false,
  });

  const [searchTriggered, setSearchTriggered] = useState(false);

  const { data: results, isLoading, refetch } = useQuery({
    queryKey: ['advanced-search', filters],
    queryFn: async () => {
      let query = supabase
        .from('admissions')
        .select(`
          id,
          admission_date,
          admission_diagnoses,
          oxygen_requirement,
          antibiotics,
          patient:patients(*)
        `);

      // Aplicar filtros
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.dateFrom) {
        query = query.gte('admission_date', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('admission_date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtros adicionales en cliente
      let filtered = data || [];

      if (filters.name) {
        filtered = filtered.filter(a => 
          a.patient?.name?.toLowerCase().includes(filters.name.toLowerCase())
        );
      }

      if (filters.rut) {
        filtered = filtered.filter(a => 
          a.patient?.rut?.includes(filters.rut)
        );
      }

      if (filters.ageMin || filters.ageMax) {
        filtered = filtered.filter(a => {
          if (!a.patient?.date_of_birth) return false;
          const age = differenceInYears(new Date(), new Date(a.patient.date_of_birth));
          const minAge = filters.ageMin ? parseInt(filters.ageMin) : 0;
          const maxAge = filters.ageMax ? parseInt(filters.ageMax) : 18;
          return age >= minAge && age <= maxAge;
        });
      }

      if (filters.diagnosis) {
        filtered = filtered.filter(a =>
          a.admission_diagnoses?.some(d => 
            d.toLowerCase().includes(filters.diagnosis.toLowerCase())
          )
        );
      }

      if (filters.hasOxygen) {
        filtered = filtered.filter(a => 
          a.oxygen_requirement && Object.keys(a.oxygen_requirement).length > 0
        );
      }

      if (filters.hasAntibiotics) {
        filtered = filtered.filter(a => 
          a.antibiotics && Array.isArray(a.antibiotics) && a.antibiotics.length > 0
        );
      }

      return filtered;
    },
    enabled: searchTriggered,
  });

  const handleSearch = () => {
    setSearchTriggered(true);
    refetch();
  };

  const handleClearFilters = () => {
    setFilters({
      name: '',
      rut: '',
      ageMin: '',
      ageMax: '',
      diagnosis: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      hasOxygen: false,
      hasAntibiotics: false,
    });
    setSearchTriggered(false);
  };

  const exportResults = () => {
    if (!results || results.length === 0) return;
    toast.success("Función de exportación en desarrollo");
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Búsqueda Avanzada de Pacientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input
              placeholder="Juan Pérez"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>RUT</Label>
            <Input
              placeholder="12.345.678-9"
              value={filters.rut}
              onChange={(e) => setFilters({ ...filters, rut: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select 
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="discharged">Egresados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Edad Mínima (años)</Label>
            <Input
              type="number"
              min="0"
              max="18"
              value={filters.ageMin}
              onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Edad Máxima (años)</Label>
            <Input
              type="number"
              min="0"
              max="18"
              value={filters.ageMax}
              onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Diagnóstico</Label>
            <Input
              placeholder="Neumonía"
              value={filters.diagnosis}
              onChange={(e) => setFilters({ ...filters, diagnosis: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Ingreso Desde</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Fecha Ingreso Hasta</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>

          <div className="space-y-3 flex flex-col justify-end">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="oxygen"
                checked={filters.hasOxygen}
                onCheckedChange={(checked) => 
                  setFilters({ ...filters, hasOxygen: checked as boolean })
                }
              />
              <Label htmlFor="oxygen" className="text-sm font-normal cursor-pointer">
                Con soporte de oxígeno
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="antibiotics"
                checked={filters.hasAntibiotics}
                onCheckedChange={(checked) => 
                  setFilters({ ...filters, hasAntibiotics: checked as boolean })
                }
              />
              <Label htmlFor="antibiotics" className="text-sm font-normal cursor-pointer">
                En tratamiento antibiótico
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Pacientes
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
          >
            Limpiar Filtros
          </Button>
        </div>

        {searchTriggered && results && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Resultados: {results.length} {results.length === 1 ? 'paciente' : 'pacientes'}
              </h3>
              {results.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportResults}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              )}
            </div>
            
            {results.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No se encontraron pacientes con estos criterios</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((admission: any) => (
                  <div
                    key={admission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => navigate(`/patients/${admission.patient.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{admission.patient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {admission.patient.rut} • {format(new Date(admission.admission_date), 'dd/MM/yyyy')}
                      </p>
                      {admission.admission_diagnoses && admission.admission_diagnoses.length > 0 && (
                        <p className="text-sm mt-1">{admission.admission_diagnoses[0]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {admission.oxygen_requirement && Object.keys(admission.oxygen_requirement).length > 0 && (
                        <Badge variant="destructive">O₂</Badge>
                      )}
                      {admission.antibiotics && admission.antibiotics.length > 0 && (
                        <Badge variant="secondary">ATB</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
