'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

type Props = {
  onDetected: (code: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Starting camera...');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;
    let controls: { stop: () => void } | null = null;

    async function start() {
      try {
        if (!videoRef.current) return;

        // Prefer back camera on phones
        const constraints = {
          video: { facingMode: { ideal: 'environment' } },
        };

        controls = await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, err) => {
            if (!active) return;
            if (result) {
              const code = result.getText();
              setStatus(`Found: ${code}`);
              active = false;
              if (controls) controls.stop();
              onDetected(code);
            }
            // Most "errors" here are just "no barcode in this frame yet" — ignore them
          }
        );

        setStatus('Point camera at a barcode...');
      } catch (err) {
        console.error('Camera error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Camera error: ${message}`);
      }
    }

    start();

    return () => {
      active = false;
      if (controls) controls.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-4 max-w-md w-full">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-white">Scan Barcode</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>

        {error ? (
          <div className="bg-red-900 p-3 rounded text-white text-sm mb-3">{error}</div>
        ) : (
          <p className="text-gray-400 text-sm mb-3">{status}</p>
        )}

        <video ref={videoRef} className="w-full rounded bg-black" playsInline muted />

        <p className="text-xs text-gray-500 mt-3 text-center">
          Hold the comic's barcode steady inside the camera view
        </p>
      </div>
    </div>
  );
}