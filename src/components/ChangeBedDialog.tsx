import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";

interface ChangeBedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBedId: string;
  currentRoom: string;
  currentBed: number;
  patientId: string;
  admissionId: string;
  onSuccess: () => void;
}

export function ChangeBedDialog({
  open,
  onOpenChange,
  currentBedId,
  currentRoom,
  currentBed,
  patientId,
  admissionId,
  onSuccess,
}: ChangeBedDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedBed, setSelectedBed] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const rooms = Array.from({ length: 12 }, (_, i) => `50${i + 1}`);
  
  const getBedsForRoom = (room: string) => {
    // Sala 507 solo tiene 1 cama
    if (room === "507") {
      return [1];
    }
    return [1, 2, 3];
  };

  const handleChangeBed = async () => {
    if (!selectedRoom || !selectedBed) {
      toast.error("Debe seleccionar sala y subcama");
      return;
    }

    // Verificar si es la misma cama
    if (selectedRoom === currentRoom && parseInt(selectedBed) === currentBed) {
      toast.error("No puede mover al paciente a la misma cama");
      return;
    }

    setIsLoading(true);
    try {
      // Verificar si la cama destino está ocupada
      const { data: existingBed, error: checkError } = await supabase
        .from("bed_assignments")
        .select("*")
        .eq("room_number", selectedRoom)
        .eq("bed_number", parseInt(selectedBed))
        .eq("is_active", true)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingBed) {
        toast.error(`La cama ${selectedRoom}-${selectedBed} ya está ocupada`);
        setIsLoading(false);
        return;
      }

      // Desactivar la asignación actual
      const { error: deactivateError } = await supabase
        .from("bed_assignments")
        .update({ 
          is_active: false, 
          discharged_at: new Date().toISOString() 
        })
        .eq("id", currentBedId);

      if (deactivateError) throw deactivateError;

      // Crear nueva asignación
      const { error: createError } = await supabase
        .from("bed_assignments")
        .insert({
          room_number: selectedRoom,
          bed_number: parseInt(selectedBed),
          patient_id: patientId,
          admission_id: admissionId,
          is_active: true,
          assigned_at: new Date().toISOString(),
        });

      if (createError) throw createError;

      // Esperar más tiempo para que AMBAS operaciones de base de datos 
      // (desactivar + crear) se completen y las suscripciones en tiempo real se actualicen
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(`Paciente movido a Cama ${selectedRoom} - Subcama ${selectedBed}`);
      
      setSelectedRoom("");
      setSelectedBed("");
      onOpenChange(false);
      
      // Llamar onSuccess al final para forzar una actualización completa
      onSuccess();
    } catch (error: any) {
      console.error("Error al cambiar de cama:", error);
      toast.error("Error al cambiar de cama: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Cambiar de Cama
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Ubicación actual:</p>
            <p className="font-semibold">
              Cama {currentRoom} - Subcama {currentBed}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Nueva Sala</Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger id="room">
                <SelectValue placeholder="Seleccionar sala" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room} value={room}>
                    Sala {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoom && (
            <div className="space-y-2">
              <Label htmlFor="bed">Nueva Subcama</Label>
              <Select value={selectedBed} onValueChange={setSelectedBed}>
                <SelectTrigger id="bed">
                  <SelectValue placeholder="Seleccionar subcama" />
                </SelectTrigger>
                <SelectContent>
                  {getBedsForRoom(selectedRoom).map((bed) => (
                    <SelectItem key={bed} value={bed.toString()}>
                      Subcama {bed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoom === "507" && (
                <p className="text-xs text-muted-foreground">
                  Sala 507 solo tiene 1 subcama
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleChangeBed}
            disabled={!selectedRoom || !selectedBed || isLoading}
          >
            {isLoading ? "Procesando..." : "Confirmar Cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
