import React, { useState, useEffect } from 'react';
import { FaBarcode, FaSync, FaUndo, FaCamera, FaTimes } from 'react-icons/fa';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const BarcodeScanner = ({ onProductDetected, onClose }) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanningStatus, setScanningStatus] = useState('idle');
  
  const {
    videoRef,
    isScanning,
    cameraActive,
    error,
    startScanner,
    stopScanner,
    restartScanner
  } = useBarcodeScanner(onProductDetected);

  // Iniciar escaneo al montar el componente
  useEffect(() => {
    if (videoRef.current) {
      startScanner(videoRef.current);
    }
    
    return () => {
      stopScanner();
    };
  }, []);

  // Actualizar estado de escaneo
  useEffect(() => {
    if (isScanning) {
      setScanningStatus('scanning');
    } else if (error) {
      setScanningStatus('error');
    } else {
      setScanningStatus('idle');
    }
  }, [isScanning, error]);

  // Manejar entrada manual
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      stopScanner();
      if (onProductDetected) {
        onProductDetected(manualCode.trim());
      }
      setManualCode('');
      setShowManualInput(false);
    }
  };

  return (
    <div className="barcode-scanner-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-bold">
          <FaBarcode className="me-2" style={{ color: '#1e7f5c' }} />
          Escanear Producto
        </h6>
        <div className="d-flex gap-2">
          {cameraActive && (
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={stopScanner}
              title="Pausar escáner"
            >
              <FaSync className="fa-spin" />
            </button>
          )}
          {onClose && (
            <button 
              className="btn btn-sm btn-outline-danger"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Vista de cámara */}
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
          
          {/* Marco de escaneo */}
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

        {/* Estado del escaneo */}
        <div className="scanner-status text-center mt-2">
          {scanningStatus === 'scanning' && (
            <div className="text-success small">
              <FaSync className="fa-spin me-2" />
              Buscando código...
            </div>
          )}
          {scanningStatus === 'error' && (
            <div className="text-danger small">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Botones de control */}
      <div className="d-flex justify-content-center gap-2 mb-3">
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ color: '#1e7f5c', borderColor: '#1e7f5c' }}
          onClick={() => setShowManualInput(!showManualInput)}
        >
          <FaBarcode className="me-1" />
          Código manual
        </button>
        {!cameraActive && (
          <button
            className="btn btn-sm btn-primary"
            style={{ backgroundColor: '#1e7f5c', borderColor: '#1e7f5c' }}
            onClick={restartScanner}
          >
            <FaUndo className="me-1" />
            Reanudar
          </button>
        )}
      </div>

      {/* Entrada manual */}
      {showManualInput && (
        <div className="card p-2 mb-2">
          <form onSubmit={handleManualSubmit}>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ingresa código de barras"
                autoFocus
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ backgroundColor: '#1e7f5c', borderColor: '#1e7f5c' }}
                disabled={!manualCode.trim()}
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instrucciones */}
      <div className="text-center">
        <p className="text-muted small mb-0">
          Apunta la cámara al código de barras
        </p>
      </div>

      {/* Estilos CSS */}
      <style>{`
        .scanner-view-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
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

export default BarcodeScanner;