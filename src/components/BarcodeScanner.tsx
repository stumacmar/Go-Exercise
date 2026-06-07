'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

// Camera barcode scanner using @zxing/browser. Calls onDetected with the
// decoded barcode string, then closes.
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        controlsRef.current = controls;
        if (cancelled) return;
        if (result) {
          controls.stop();
          onDetected(result.getText());
        }
      })
      .catch((e: unknown) => {
        setError(
          e instanceof Error && e.name === 'NotAllowedError'
            ? 'Camera permission denied. Enable it in your browser, or enter the barcode manually.'
            : 'Could not start the camera. You can type the barcode or add food manually.',
        );
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-text font-medium">Scan a barcode</span>
        <button onClick={onClose} className="btn-ghost py-1.5 px-3 text-sm">
          Close
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="relative w-full max-w-md aspect-square rounded-xl2 overflow-hidden border border-line">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-accent/80" />
        </div>
      </div>
      <div className="p-5 text-center">
        {error ? (
          <p className="text-warn text-sm">{error}</p>
        ) : (
          <p className="text-muted text-sm">
            Point your camera at the product barcode.
          </p>
        )}
      </div>
    </div>
  );
}
