import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export const useBarcodeScanner = (onBarcodeDetected) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [lastScannedCode, setLastScannedCode] = useState(null);
  
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const scanThrottleMs = 2000; // 2 segundos de throttle para evitar duplicados

  // Inicializar el lector de códigos
  const initCodeReader = useCallback(() => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    return codeReaderRef.current;
  }, []);

  // Reproducir sonido de confirmación
  const playScanSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.log('No se pudo reproducir sonido:', err);
    }
  }, []);

  // Manejar detección de código con throttling
  const handleBarcodeDetected = useCallback((barcode) => {
    const now = Date.now();
    
    // Evitar duplicados dentro del período de throttling
    if (lastScannedCode === barcode && (now - lastScanTimeRef.current) < scanThrottleMs) {
      return;
    }
    
    // Actualizar estado
    setLastScannedCode(barcode);
    lastScanTimeRef.current = now;
    
    // Vibración
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // Sonido
    playScanSound();
    
    // Llamar callback
    if (onBarcodeDetected) {
      onBarcodeDetected(barcode);
    }
  }, [lastScannedCode, onBarcodeDetected, playScanSound]);

  // Iniciar escaneo con ZXing
  const startScanner = useCallback(async (videoElement) => {
    if (!videoElement) {
      setError('No se encontró elemento de video');
      return;
    }

    try {
      const codeReader = initCodeReader();
      
      setIsScanning(true);
      setError(null);
      setCameraActive(true);
      
      // Configurar para cámara trasera
      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // Iniciar escaneo continuo
      await codeReader.decodeFromVideoDevice(null, videoElement, (result, err) => {
        if (result) {
          const barcode = result.getText();
          handleBarcodeDetected(barcode);
        }
        
        // Ignorar errores de lectura (continuar escaneando)
        if (err && !(err instanceof Error)) {
          return;
        }
      });

      // Timeout después de 10 segundos sin detección
      timeoutRef.current = setTimeout(() => {
        if (cameraActive) {
          setError('No se detectó código. Intenta nuevamente.');
          stopScanner();
        }
      }, 10000);

    } catch (err) {
      console.error('Error iniciando ZXing scanner:', err);
      setError('Error al iniciar la cámara: ' + err.message);
      setIsScanning(false);
      setCameraActive(false);
    }
  }, [initCodeReader, cameraActive, handleBarcodeDetected]);

  // Detener escaneo
  const stopScanner = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setCameraActive(false);
    setError(null);
  }, []);

  // Reiniciar escaneo
  const restartScanner = useCallback(() => {
    setLastScannedCode(null);
    lastScanTimeRef.current = 0;
    setError(null);
    if (videoRef.current) {
      startScanner(videoRef.current);
    }
  }, [startScanner]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopScanner();
    };
  }, []);

  return {
    videoRef,
    isScanning,
    cameraActive,
    error,
    lastScannedCode,
    startScanner,
    stopScanner,
    restartScanner
  };
};

export default useBarcodeScanner;