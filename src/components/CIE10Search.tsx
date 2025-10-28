import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CIE10Code {
  id: string;
  code: string;
  description: string;
  category: string;
}

interface CIE10SearchProps {
  selectedDiagnoses: string[];
  onDiagnosesChange: (diagnoses: string[]) => void;
}

export function CIE10Search({ selectedDiagnoses, onDiagnosesChange }: CIE10SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<CIE10Code[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchCodes = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("cie10_codes")
          .select("*")
          .or(`code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          .limit(10);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching CIE-10:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchCodes, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const addDiagnosis = (code: CIE10Code) => {
    const diagnosisString = `${code.code} - ${code.description}`;
    if (!selectedDiagnoses.includes(diagnosisString)) {
      onDiagnosesChange([...selectedDiagnoses, diagnosisString]);
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeDiagnosis = (diagnosis: string) => {
    onDiagnosesChange(selectedDiagnoses.filter(d => d !== diagnosis));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Diagnósticos de Ingreso (CIE-10)</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código o descripción..."
            className="pl-10"
          />
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 border rounded-lg bg-card shadow-lg absolute z-50 w-full max-w-2xl">
            <ScrollArea className="max-h-64">
              <div className="p-2">
                {searchResults.map((code) => (
                  <Button
                    key={code.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-accent"
                    onClick={() => addDiagnosis(code)}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {code.code}
                        </Badge>
                        {code.category && (
                          <Badge variant="secondary" className="text-xs">
                            {code.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{code.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {isSearching && searchTerm.length >= 2 && (
          <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
        )}

        {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
          <p className="text-sm text-muted-foreground mt-2">
            No se encontraron resultados. Intenta con otro término.
          </p>
        )}
      </div>

      {selectedDiagnoses.length > 0 && (
        <div className="space-y-2">
          <Label>Diagnósticos Seleccionados:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedDiagnoses.map((diagnosis, index) => (
              <Badge
                key={index}
                variant="default"
                className="text-sm py-2 px-3 flex items-center gap-2"
              >
                <span>{diagnosis}</span>
                <button
                  type="button"
                  onClick={() => removeDiagnosis(diagnosis)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
