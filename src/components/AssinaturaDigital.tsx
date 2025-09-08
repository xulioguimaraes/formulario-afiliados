"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

interface AssinaturaDigitalProps {
  onSignatureChange: (signatureData: string | null) => void;
}

export default function AssinaturaDigital({ onSignatureChange }: AssinaturaDigitalProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      onSignatureChange(signatureData);
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  };


  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border-2 border-gray-300 p-4">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assinatura Digital *
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Assine na área abaixo usando o mouse ou touch
          </p>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
          <SignatureCanvas
            ref={signatureRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: "signature-canvas w-full h-48 border border-gray-300 rounded bg-white"
            }}
            onBegin={handleBegin}
            onEnd={handleEnd}
            backgroundColor="white"
            penColor="black"
            minWidth={2}
            maxWidth={3}
          />
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <button
            type="button"
            onClick={clearSignature}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200"
          >
            Limpar
          </button>
          
          <div className="text-sm text-gray-600">
            {isEmpty ? (
              <span className="text-red-500">Assinatura obrigatória</span>
            ) : (
              <span className="text-green-600">✓ Assinatura capturada</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
