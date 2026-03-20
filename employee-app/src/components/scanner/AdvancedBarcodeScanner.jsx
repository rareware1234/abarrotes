import React, { useState, useEffect, useRef } from 'react';
import { FaBarcode, FaSync, FaUndo, FaCamera } from 'react-icons/fa';
import productService from '../../services/productService';

const AdvancedBarcodeScanner = ({ onProductFound, onManualInput }) => {
  const [showManualInput, setShowManualInput] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [scanningStatus, setScanningStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [cameraSupported, setCameraSupported] = useState(false);
  const videoRef = useRef(null);

  // Verificar soporte de cámara
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraSupported(true);
      } catch (err) {
        console.log('Cámara no disponible:', err);
        setCameraSupported(false);
      }
    };
    
    checkCameraSupport();
  }, []);

  // Intentar iniciar cámara si está disponible
  useEffect(() => {
    if (cameraSupported && videoRef.current) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch (err) {
          console.log('No se pudo iniciar cámara:', err);
        }
      };
      
      startCamera();
      
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [cameraSupported]);

  // Manejar entrada manual
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    setScanningStatus('scanning');
    setError(null);
    
    try {
      const product = await productService.getProductByBarcode(manualCode.trim());
      
      if (product) {
        setScanningStatus('detected');
        if (onProductFound) {
          onProductFound(product);
        }
      } else {
        setScanningStatus('error');
        setError('Producto no encontrado');
      }
    } catch (err) {
      console.error('Error buscando producto:', err);
      setScanningStatus('error');
      setError('Producto no encontrado o error de conexión');
    }
  };

  return (
    <div className="advanced-barcode-scanner">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 mb-0 fw-bold">
          <FaBarcode className="me-2" style={{ color: '#1e7f5c' }} />
          Buscar Producto
        </h3>
        {cameraSupported && (
          <span className="badge bg-success">Cámara disponible</span>
        )}
      </div>

      {/* Vista de cámara si está disponible */}
      {cameraSupported && (
        <div className="scanner-view-container mb-3">
          <div className="scanner-frame">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="scanner-video"
              style={{ 
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                backgroundColor: '#000',
                borderRadius: '8px'
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
            </div>
          </div>
        </div>
      )}

      {/* Entrada manual */}
      <div className="card p-3 mb-3">
        <form onSubmit={handleManualSubmit}>
          <div className="input-group">
            <span className="input-group-text bg-white">
              <FaBarcode style={{ color: '#666' }} />
            </span>
            <input
              type="text"
              className="form-control"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ingresa el código de barras"
              autoFocus
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ backgroundColor: '#1e7f5c', borderColor: '#1e7f5c' }}
              disabled={!manualCode.trim() || scanningStatus === 'scanning'}
            >
              {scanningStatus === 'scanning' ? (
                <FaSync className="fa-spin" />
              ) : (
                'Buscar'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Estado */}
      {scanningStatus === 'detected' && (
        <div className="alert alert-success text-center">
          ✓ Código detectado, buscando producto...
        </div>
      )}
      
      {scanningStatus === 'error' && error && (
        <div className="alert alert-warning text-center">
          {error}
        </div>
      )}

      {/* Instrucciones */}
      <div className="text-center">
        <p className="text-muted small mb-0">
          {cameraSupported 
            ? 'Apunta la cámara al código de barras o ingresa el código manualmente'
            : 'Ingresa el código de barras del producto manualmente'}
        </p>
      </div>

      {/* Estilos */}
      <style>{`
        .advanced-barcode-scanner {
          animation: fadeIn 0.3s ease;
        }
        
        .scanner-view-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .scanner-frame {
          position: relative;
          width: 100%;
        }
        
        .scanner-video {
          display: block;
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
        
        .top-left {
          top: 0; left: 0;
          border-top-width: 3px;
          border-left-width: 3px;
        }
        
        .top-right {
          top: 0; right: 0;
          border-top-width: 3px;
          border-right-width: 3px;
        }
        
        .bottom-left {
          bottom: 0; left: 0;
          border-bottom-width: 3px;
          border-left-width: 3px;
        }
        
        .bottom-right {
          bottom: 0; right: 0;
          border-bottom-width: 3px;
          border-right-width: 3px;
        }
      `}</style>
    </div>
  );
};

export default AdvancedBarcodeScanner;