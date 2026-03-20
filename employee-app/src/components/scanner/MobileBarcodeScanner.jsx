import React, { useState, useEffect, useRef } from 'react';
import { FaCamera, FaExclamationTriangle, FaSync } from 'react-icons/fa';

const MobileBarcodeScanner = ({ onBarcodeDetected, onStatusChange }) => {
  const [cameraStatus, setCameraStatus] = useState('checking'); // checking, available, denied, error
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    checkCameraPermissions();
    
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraPermissions = async () => {
    try {
      // Verificar si el protocolo es seguro
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        setCameraStatus('error');
        setErrorMessage('La cámara requiere HTTPS. Accede por HTTPS o usa localhost.');
        if (onStatusChange) onStatusChange('error');
        return;
      }

      // Intentar obtener acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      setCameraStatus('available');
      if (onStatusChange) onStatusChange('available');
      
      // Detener el stream temporalmente
      stopCamera();
      
    } catch (err) {
      console.error('Error de cámara:', err);
      
      let errorMsg = 'No se pudo acceder a la cámara.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('denied');
        errorMsg = 'Permiso de cámara denegado. Ve a Configuración > Permisos > Cámara.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraStatus('error');
        errorMsg = 'No se encontró ninguna cámara en el dispositivo.';
      } else if (err.name === 'NotSupportedError') {
        setCameraStatus('error');
        errorMsg = 'El navegador no soporta acceso a la cámara. Usa Chrome o Safari.';
      } else {
        setCameraStatus('error');
      }
      
      setErrorMessage(errorMsg);
      if (onStatusChange) onStatusChange('error');
    }
  };

  const startCamera = async () => {
    if (cameraStatus !== 'available' || !videoRef.current) return;
    
    try {
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      // Iniciar detección de código de barras (simulado por ahora)
      startBarcodeDetection();
      
    } catch (err) {
      console.error('Error iniciando cámara:', err);
      setCameraStatus('error');
      setErrorMessage('Error al iniciar la cámara. Intenta nuevamente.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startBarcodeDetection = () => {
    // Aquí integrarías con una librería de detección de códigos de barras
    // Por ahora, simulamos la detección
    console.log('Iniciando detección de códigos de barras...');
  };

  const toggleScanner = () => {
    if (isScanning) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="mobile-barcode-scanner">
      {/* Estado de la cámara */}
      {cameraStatus === 'checking' && (
        <div className="text-center py-4">
          <FaSync className="fa-spin fa-2x text-primary mb-2" />
          <p className="text-muted">Verificando cámara...</p>
        </div>
      )}

      {cameraStatus === 'denied' && (
        <div className="alert alert-warning text-center">
          <FaExclamationTriangle className="me-2" />
          {errorMessage}
          <button 
            className="btn btn-sm btn-outline-warning mt-2"
            onClick={checkCameraPermissions}
          >
            Reintentar
          </button>
        </div>
      )}

      {cameraStatus === 'error' && (
        <div className="alert alert-danger text-center">
          <FaExclamationTriangle className="me-2" />
          {errorMessage}
        </div>
      )}

      {cameraStatus === 'available' && (
        <div>
          <div className="position-relative" style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000' }}>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ 
                width: '100%', 
                height: '250px', 
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
            />
            <div className="scanner-overlay">
              <div className="scan-line"></div>
              <div className="scan-corners">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
              <div className="scan-hints">
                <div className="hint-top">Apunta al código de barras</div>
                <div className="hint-bottom">Se detectará automáticamente</div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-2">
            <button 
              className="btn btn-danger btn-sm"
              onClick={toggleScanner}
            >
              <FaCamera className="me-1" />
              {isScanning ? 'Detener' : 'Iniciar'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .mobile-barcode-scanner {
          animation: fadeIn 0.3s ease;
        }
        
        .scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        
        .scan-line {
          position: absolute;
          top: 50%;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            #dc3545 20%, 
            #dc3545 80%, 
            transparent 100%);
          animation: scan 2s linear infinite;
          box-shadow: 0 0 10px #dc3545;
        }
        
        @keyframes scan {
          0% { top: 20%; }
          50% { top: 80%; }
          100% { top: 20%; }
        }
        
        .scan-corners {
          position: absolute;
          top: 10%;
          left: 10%;
          right: 10%;
          bottom: 10%;
        }
        
        .corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: #1e7f5c;
          border-style: solid;
          border-width: 0;
        }
        
        .top-left { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; }
        .top-right { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; }
        .bottom-left { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; }
        .bottom-right { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }
        
        .scan-hints {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 10px;
          color: white;
          font-size: 0.8rem;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        
        .hint-top, .hint-bottom {
          text-align: center;
          background: rgba(0,0,0,0.5);
          padding: 4px 8px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default MobileBarcodeScanner;
