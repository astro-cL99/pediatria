import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, X } from 'lucide-react';
import SignatureModal from './SignatureModal';

interface SignaturePreviewProps {
  signatureData?: string | null;
  onSave: (signatureData: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  showClearButton?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SignaturePreview: React.FC<SignaturePreviewProps> = ({
  signatureData,
  onSave,
  onClear,
  width = 200,
  height = 100,
  showClearButton = true,
  className = '',
  style = {},
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef<{ open: () => void; close: () => void }>(null);

  const handleSave = (signature: string) => {
    onSave(signature);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) onClear();
  };

  const handlePreviewClick = () => {
    if (modalRef.current) {
      modalRef.current.open();
    }
  };

  return (
    <div className={`space-y-2 ${className}`} style={style}>
      <div 
        className="border rounded-md p-2 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handlePreviewClick}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {signatureData ? (
          <div className="relative w-full h-full">
            <img 
              src={signatureData} 
              alt="Firma digital" 
              className="w-full h-full object-contain"
            />
            {showClearButton && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                aria-label="Eliminar firma"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm text-center">
            <Edit className="mx-auto h-6 w-6 mb-1" />
            Haga clic para firmar
          </div>
        )}
      </div>
      
      <SignatureModal
        ref={modalRef}
        onSave={handleSave}
        title={signatureData ? "Editar Firma" : "Agregar Firma"}
        description={signatureData ? "Edite su firma a continuación" : "Por favor, firme en el área designada"}
        confirmButtonText={signatureData ? "Actualizar Firma" : "Guardar Firma"}
        penColor="#000000"
      />
    </div>
  );
};

export default SignaturePreview;
