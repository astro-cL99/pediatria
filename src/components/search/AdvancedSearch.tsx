import { useState, useRef, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type FilterCondition = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';

export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface Filter {
  id: string;
  field: string;
  condition: FilterCondition;
  value: any;
}

interface AdvancedSearchProps {
  fields: FilterField[];
  onSearch: (filters: Filter[], searchTerm: string) => void;
  onReset?: () => void;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
}

export function AdvancedSearch({
  fields,
  onSearch,
  onReset,
  placeholder = 'Buscar...',
  className = '',
  debounceTime = 300,
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, debounceTime);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Condiciones disponibles según el tipo de campo
  const getConditionsForType = (type: FilterField['type']): { value: FilterCondition; label: string }[] => {
    const commonConditions = [
      { value: 'equals' as const, label: 'Igual a' },
      { value: 'contains' as const, label: 'Contiene' },
    ];

    switch (type) {
      case 'number':
        return [
          ...commonConditions,
          { value: 'greaterThan' as const, label: 'Mayor que' },
          { value: 'lessThan' as const, label: 'Menor que' },
        ];
      case 'text':
        return [
          ...commonConditions,
          { value: 'startsWith' as const, label: 'Empieza con' },
          { value: 'endsWith' as const, label: 'Termina con' },
        ];
      case 'date':
        return [
          { value: 'equals' as const, label: 'Igual a' },
          { value: 'greaterThan' as const, label: 'Después de' },
          { value: 'lessThan' as const, label: 'Antes de' },
        ];
      case 'boolean':
        return [{ value: 'equals' as const, label: 'Es igual a' }];
      case 'select':
        return [{ value: 'equals' as const, label: 'Es igual a' }];
      default:
        return commonConditions;
    }
  };

  const addFilter = () => {
    if (fields.length > 0) {
      const newFilter: Filter = {
        id: Date.now().toString(),
        field: fields[0].id,
        condition: 'contains',
        value: '',
      };
      setFilters([...filters, newFilter]);
    }
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(
      filters.map((filter) =>
        filter.id === id ? { ...filter, ...updates } : filter
      )
    );
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((filter) => filter.id !== id));
  };

  const handleSearch = () => {
    onSearch(filters, debouncedSearchTerm);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilters([]);
    onReset?.();
  };

  // Efecto para cerrar el popover cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtener el campo actual seleccionado
  const getFieldById = (fieldId: string) => {
    return fields.find((field) => field.id === fieldId) || fields[0];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <Icons.filter className="h-4 w-4 mr-2" />
              Filtros {filters.length > 0 && `(${filters.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-4" ref={popoverRef}>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Filtros avanzados</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addFilter}
                  disabled={fields.length === 0}
                >
                  <Icons.plus className="h-4 w-4 mr-1" />
                  Agregar filtro
                </Button>
              </div>

              {filters.length === 0 ? (
                <div className="text-center py-4 text-sm text-gray-500">
                  No hay filtros aplicados
                </div>
              ) : (
                <div className="space-y-3">
                  {filters.map((filter) => {
                    const field = getFieldById(filter.field);
                    const conditions = getConditionsForType(field.type);

                    return (
                      <div key={filter.id} className="space-y-2 p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium">Filtro</h5>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeFilter(filter.id)}
                          >
                            <Icons.x className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Campo</Label>
                            <select
                              className="w-full p-2 border rounded text-sm"
                              value={filter.field}
                              onChange={(e) =>
                                updateFilter(filter.id, { field: e.target.value })
                              }
                            >
                              {fields.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label>Condición</Label>
                            <select
                              className="w-full p-2 border rounded text-sm"
                              value={filter.condition}
                              onChange={(e) =>
                                updateFilter(filter.id, {
                                  condition: e.target.value as FilterCondition,
                                })
                              }
                            >
                              {conditions.map((cond) => (
                                <option key={cond.value} value={cond.value}>
                                  {cond.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label>Valor</Label>
                            {field.type === 'select' ? (
                              <select
                                className="w-full p-2 border rounded text-sm"
                                value={filter.value}
                                onChange={(e) =>
                                  updateFilter(filter.id, { value: e.target.value })
                                }
                              >
                                <option value="">Seleccionar...</option>
                                {field.options?.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'boolean' ? (
                              <select
                                className="w-full p-2 border rounded text-sm"
                                value={filter.value}
                                onChange={(e) =>
                                  updateFilter(filter.id, { value: e.target.value === 'true' })
                                }
                              >
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                              </select>
                            ) : field.type === 'date' ? (
                              <input
                                type="date"
                                className="w-full p-2 border rounded text-sm"
                                value={filter.value || ''}
                                onChange={(e) =>
                                  updateFilter(filter.id, { value: e.target.value })
                                }
                              />
                            ) : field.type === 'number' ? (
                              <input
                                type="number"
                                className="w-full p-2 border rounded text-sm"
                                value={filter.value || ''}
                                onChange={(e) =>
                                  updateFilter(filter.id, { value: e.target.value })
                                }
                                placeholder={field.placeholder}
                              />
                            ) : (
                              <input
                                type="text"
                                className="w-full p-2 border rounded text-sm"
                                value={filter.value || ''}
                                onChange={(e) =>
                                  updateFilter(filter.id, { value: e.target.value })
                                }
                                placeholder={field.placeholder}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters([]);
                    onReset?.();
                  }}
                  disabled={filters.length === 0}
                >
                  Limpiar filtros
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleSearch();
                    setIsFilterOpen(false);
                  }}
                >
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} disabled={!searchTerm && filters.length === 0}>
          <Icons.search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
        
        {(searchTerm || filters.length > 0) && (
          <Button variant="ghost" onClick={handleReset}>
            <Icons.x className="h-4 w-4" />
            <span className="sr-only">Limpiar búsqueda</span>
          </Button>
        )}
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const field = getFieldById(filter.field);
            return (
              <Badge key={filter.id} variant="secondary" className="px-2 py-1">
                <span className="font-medium">{field.label}</span>
                <span className="mx-1">
                  {filter.condition === 'contains' && 'contiene'}
                  {filter.condition === 'equals' && 'es igual a'}
                  {filter.condition === 'startsWith' && 'empieza con'}
                  {filter.condition === 'endsWith' && 'termina con'}
                  {filter.condition === 'greaterThan' && 'mayor que'}
                  {filter.condition === 'lessThan' && 'menor que'}
                </span>
                <span className="font-semibold">{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <Icons.x className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
