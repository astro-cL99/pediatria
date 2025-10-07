import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClinicalDocument {
  id: string;
  patient_id: string | null;
  admission_id: string | null;
  document_type: string;
  file_name: string;
  file_path: string;
  extracted_data: any;
  embeddings: any;
  uploaded_by: string | null;
  uploaded_at: string;
  processed: boolean;
  confidence_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClinicalDocuments(patientId?: string) {
  return useQuery({
    queryKey: ["clinical-documents", patientId],
    queryFn: async () => {
      let query = supabase
        .from("clinical_documents")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (patientId) {
        query = query.eq("patient_id", patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ClinicalDocument[];
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      patientId,
      admissionId,
    }: {
      file: File;
      patientId?: string;
      admissionId?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Sanitizar nombre de archivo (remover espacios y caracteres especiales)
      const fileExt = file.name.split(".").pop();
      const sanitizedName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(/_{2,}/g, "_");
      const fileName = `${Date.now()}_${sanitizedName}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Procesar con PDF.js si es PDF
      let imageBase64List: string[] = [];
      
      if (file.type === "application/pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        // Usar worker de jsdelivr como alternativa más estable
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvasElement = window.document.createElement("canvas");
          const context = canvasElement.getContext("2d");
          
          if (!context) continue;

          canvasElement.height = viewport.height;
          canvasElement.width = viewport.width;

          await page.render({ canvasContext: context, viewport: viewport, intent: 'display' } as any).promise;
          
          const imageData = canvasElement.toDataURL("image/png");
          imageBase64List.push(imageData.split(",")[1]);
        }
      }

      // Llamar edge function para clasificar y extraer
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke(
        "classify-and-extract",
        {
          body: {
            imageBase64List: imageBase64List.length > 0 ? imageBase64List : undefined,
            imageBase64: imageBase64List[0],
            fileName: file.name,
          },
        }
      );

      if (extractionError) throw extractionError;
      if (!extractionData?.success) {
        throw new Error(extractionData?.error || "Error al procesar documento");
      }

      // Guardar en base de datos
      const { data: clinicalDoc, error: dbError } = await supabase
        .from("clinical_documents")
        .insert({
          patient_id: patientId,
          admission_id: admissionId,
          document_type: extractionData.documentType,
          file_name: file.name,
          file_path: filePath,
          extracted_data: extractionData.extractedData,
          uploaded_by: user.id,
          confidence_score: extractionData.confidenceScore,
          processed: false,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generar embeddings en background
      supabase.functions
        .invoke("generate-embeddings", {
          body: { documentIds: [clinicalDoc!.id] },
        })
        .catch((err) => console.error("Error generando embeddings:", err));

      return clinicalDoc;
    },
    onSuccess: () => {
      toast.success("Documento procesado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["clinical-documents"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al subir documento");
    },
  });
}
