import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  getSignature: () => string | null;
  getTrimmedSignature: () => string | null;
}

interface SignaturePadProps {
  onSign?: (signed: boolean) => void;
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
  clearButtonText?: string;
  clearButtonClass?: string;
  penColor?: string;
  backgroundColor?: string;
  minWidth?: number;
  maxWidth?: number;
  velocityFilterWeight?: number;
  throttle?: number;
  onBegin?: () => void;
  onEnd?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({
    onSign,
    canvasProps = {},
    clearButtonText = 'Limpiar',
    clearButtonClass = '',
    penColor = 'black',
    backgroundColor = 'rgba(255, 255, 255, 0)',
    minWidth = 0.5,
    maxWidth = 2.5,
    velocityFilterWeight = 0.7,
    throttle = 16,
    onBegin,
    onEnd,
    className = '',
    style = {},
  }, ref) => {
    const sigCanvas = useRef<SignatureCanvas>(null);

    const clear = () => {
      if (sigCanvas.current) {
        sigCanvas.current.clear();
        if (onSign) onSign(false);
      }
    };

    const handleBegin = () => {
      if (onBegin) onBegin();
    };

    const handleEnd = () => {
      if (onEnd) onEnd();
      if (onSign && sigCanvas.current) {
        onSign(!sigCanvas.current.isEmpty());
      }
    };

    useImperativeHandle(ref, () => ({
      clear: () => {
        if (sigCanvas.current) {
          sigCanvas.current.clear();
        }
      },
      isEmpty: () => {
        return sigCanvas.current ? sigCanvas.current.isEmpty() : true;
      },
      getSignature: () => {
        return sigCanvas.current ? sigCanvas.current.toDataURL() : null;
      },
      getTrimmedSignature: () => {
        return sigCanvas.current ? sigCanvas.current.getTrimmedCanvas().toDataURL('image/png') : null;
      },
    }));

    return (
      <div className={`flex flex-col space-y-4 ${className}`} style={style}>
        <div className="border rounded-md p-2 bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            penColor={penColor}
            canvasProps={{
              width: 400,
              height: 200,
              className: 'signature-canvas',
              ...canvasProps,
            }}
            onBegin={handleBegin}
            onEnd={handleEnd}
            backgroundColor={backgroundColor}
            minWidth={minWidth}
            maxWidth={maxWidth}
            velocityFilterWeight={velocityFilterWeight}
            throttle={throttle}
          />
        </div>
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clear}
            className={clearButtonClass}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {clearButtonText}
          </Button>
          <div className="text-sm text-muted-foreground">
            Firma en el área superior
          </div>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
