import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SignaturePad, { SignaturePadHandle } from './SignaturePad';

interface SignatureModalProps {
  title?: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onSave?: (signatureData: string) => void;
  onCancel?: () => void;
  penColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export interface SignatureModalHandle {
  open: () => void;
  close: () => void;
  getSignature: () => string | null;
  clearSignature: () => void;
}

const SignatureModal = forwardRef<SignatureModalHandle, SignatureModalProps>(
  ({
    title = 'Firma Digital',
    description = 'Por favor, firme en el área designada',
    confirmButtonText = 'Guardar Firma',
    cancelButtonText = 'Cancelar',
    onSave,
    onCancel,
    penColor = '#000000',
    className = '',
    style = {},
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const signatureRef = useRef<SignaturePadHandle>(null);

    const open = () => setIsOpen(true);
    const close = () => {
      setIsOpen(false);
      if (onCancel) onCancel();
    };

    const handleSave = () => {
      if (signatureRef.current && hasSignature) {
        const signatureData = signatureRef.current.getTrimmedSignature();
        if (signatureData && onSave) {
          onSave(signatureData);
        }
      }
      close();
    };

    const handleClear = () => {
      if (signatureRef.current) {
        signatureRef.current.clear();
        setHasSignature(false);
      }
    };

    const handleSignatureChange = (signed: boolean) => {
      setHasSignature(signed);
    };

    useImperativeHandle(ref, () => ({
      open,
      close,
      getSignature: () => {
        return signatureRef.current ? signatureRef.current.getTrimmedSignature() : null;
      },
      clearSignature: () => {
        if (signatureRef.current) {
          signatureRef.current.clear();
          setHasSignature(false);
        }
      },
    }));

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SignaturePad
              ref={signatureRef}
              onSign={handleSignatureChange}
              penColor={penColor}
              clearButtonText="Limpiar Firma"
              className={className}
              style={style}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {cancelButtonText}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasSignature}
            >
              {confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

SignatureModal.displayName = 'SignatureModal';

export default SignatureModal;
