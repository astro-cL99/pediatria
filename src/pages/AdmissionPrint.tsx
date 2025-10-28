import { useParams } from "react-router-dom";
import { AdmissionPrintView } from "@/components/AdmissionPrintView";

export default function AdmissionPrint() {
  const { id } = useParams();

  if (!id) {
    return <div>Admisión no encontrada</div>;
  }

  return <AdmissionPrintView admissionId={id} />;
}