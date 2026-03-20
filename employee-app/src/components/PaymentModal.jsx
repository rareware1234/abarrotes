import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMoneyBill, FaCreditCard, FaQrcode, FaMobileAlt, FaUniversity, FaCheck, FaSpinner, FaCopy, FaCheckCircle } from 'react-icons/fa';
import { mockPaymentService, PAYMENT_METHODS } from '../services/paymentService';

const PaymentModal = ({ isOpen, onClose, total, onPaymentComplete, saleId }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [step, setStep] = useState('select'); // select, qr, cash, processing, success
  const [qrData, setQrData] = useState(null);
  const [cashAmount, setCashAmount] = useState('');
  const [change, setChange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const paymentMethods = [
    { ...PAYMENT_METHODS.EFECTIVO, onClick: () => selectMethod(PAYMENT_METHODS.EFECTIVO) },
    { ...PAYMENT_METHODS.MERCADOPAGO_QR, onClick: () => selectMethod(PAYMENT_METHODS.MERCADOPAGO_QR) },
    { ...PAYMENT_METHODS.TARJETA_CREDITO, onClick: () => selectMethod(PAYMENT_METHODS.TARJETA_CREDITO) },
    { ...PAYMENT_METHODS.TARJETA_DEBITO, onClick: () => selectMethod(PAYMENT_METHODS.TARJETA_DEBITO) },
    { ...PAYMENT_METHODS.CODI, onClick: () => selectMethod(PAYMENT_METHODS.CODI) },
    { ...PAYMENT_METHODS.TRANSFERENCIA, onClick: () => selectMethod(PAYMENT_METHODS.TRANSFERENCIA) },
  ];

  const selectMethod = (method) => {
    setSelectedMethod(method);
    setError(null);
    
    if (method.requiereQR) {
      generateQR(method);
    } else if (method.requiereMonto) {
      setStep('cash');
    } else if (method.requiereTerminal) {
      processCardPayment(method);
    } else {
      setStep('select');
    }
  };

  const generateQR = async (method) => {
    setLoading(true);
    setStep('processing');
    
    try {
      const result = await mockPaymentService.generateQR(method, total);
      
      if (result.success) {
        setQrData(result);
        setStep('qr');
      } else {
        setError(result.error);
        setStep('select');
      }
    } catch (err) {
      setError('Error al generar QR');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const processCashPayment = () => {
    const cash = parseFloat(cashAmount);
    
    if (!cash || cash < total) {
      setError(`Monto insuficiente. Total: $${total.toFixed(2)}`);
      return;
    }
    
    setChange(cash - total);
    setStep('success');
    onPaymentComplete({
      success: true,
      tipoPago: 'Efectivo',
      monto: total,
      efectivoRecibido: cash,
      cambio: cash - total,
      referencia: `EF-${Date.now()}`
    });
  };

  const processCardPayment = async (method) => {
    setLoading(true);
    setStep('processing');
    
    try {
      const result = await mockPaymentService.processPayment(method, total);
      
      if (result.success) {
        setStep('success');
        onPaymentComplete(result);
      } else {
        setError(result.error);
        setStep('select');
      }
    } catch (err) {
      setError('Error al procesar pago');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const confirmQRPayment = () => {
    setStep('success');
    onPaymentComplete({
      success: true,
      tipoPago: selectedMethod.nombre,
      monto: total,
      referencia: qrData?.referencia,
      qrCode: qrData?.qrCode
    });
  };

  const copyReference = () => {
    navigator.clipboard.writeText(qrData?.referencia);
  };

  const reset = () => {
    setSelectedMethod(null);
    setStep('select');
    setQrData(null);
    setCashAmount('');
    setChange(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="payment-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="payment-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="payment-header">
          <h2>Método de Pago</h2>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="payment-total">
          <span>Total a pagar</span>
          <span className="amount">${total.toFixed(2)}</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              className="payment-methods"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error && (
                <div className="payment-error">{error}</div>
              )}
              
              <div className="methods-grid">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    className="method-btn"
                    onClick={method.onClick}
                    style={{ '--method-color': method.color }}
                  >
                    <span className="method-icon">{method.icono}</span>
                    <span className="method-name">{method.nombre}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'cash' && (
            <motion.div
              key="cash"
              className="cash-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3>Efectivo</h3>
              
              <div className="quick-amounts">
                <button onClick={() => setCashAmount((total * 1).toFixed(0))}>
                  ${Math.ceil(total)}
                </button>
                <button onClick={() => setCashAmount((total * 2).toFixed(0))}>
                  ${Math.ceil(total * 2)}
                </button>
                <button onClick={() => setCashAmount((total * 5).toFixed(0))}>
                  ${Math.ceil(total * 5)}
                </button>
                <button onClick={() => setCashAmount('1000')}>
                  $1,000
                </button>
              </div>

              <div className="cash-input">
                <label>Monto recibido</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {parseFloat(cashAmount) >= total && (
                <div className="change-display">
                  <span>Cambio:</span>
                  <span className="change-amount">
                    ${(parseFloat(cashAmount) - total).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="cash-actions">
                <button className="btn-back" onClick={reset}>
                  Atrás
                </button>
                <button
                  className="btn-confirm"
                  onClick={processCashPayment}
                  disabled={parseFloat(cashAmount) < total}
                >
                  Confirmar Pago
                </button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              className="processing-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="spinner">
                <FaSpinner className="spin" />
              </div>
              <p>{selectedMethod?.id === 'mercadopago_qr' ? 'Generando QR...' : 'Procesando pago...'}</p>
            </motion.div>
          )}

          {step === 'qr' && (
            <motion.div
              key="qr"
              className="qr-section"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3>{selectedMethod?.nombre}</h3>
              <p className="qr-instruction">Muestra el QR al cliente para cobrar</p>
              
              <div className="qr-container">
                <img src={qrData?.qrCode} alt="QR Code" className="qr-image" />
              </div>

              <div className="qr-reference">
                <span>Referencia:</span>
                <div className="reference-box">
                  <span>{qrData?.referencia}</span>
                  <button onClick={copyReference}>
                    <FaCopy />
                  </button>
                </div>
              </div>

              <p className="qr-amount">Monto: <strong>${total.toFixed(2)}</strong></p>

              <div className="qr-actions">
                <button className="btn-back" onClick={reset}>
                  Cancelar
                </button>
                <button className="btn-confirm" onClick={confirmQRPayment}>
                  <FaCheck /> Pago Recibido
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              className="success-section"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="success-icon">
                <FaCheckCircle />
              </div>
              <h3>¡Pago Exitoso!</h3>
              <p>La venta #{saleId || 'N/A'} ha sido completada</p>
              
              <div className="success-details">
                <div className="detail-row">
                  <span>Método:</span>
                  <span>{selectedMethod?.nombre || 'Efectivo'}</span>
                </div>
                <div className="detail-row">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {change !== null && (
                  <div className="detail-row change">
                    <span>Cambio:</span>
                    <span>${change.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <button className="btn-done" onClick={handleClose}>
                Listo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .payment-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .payment-modal {
          background: #1a1a28;
          border-radius: 24px;
          width: 100%;
          max-width: 420px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .payment-header h2 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .close-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .payment-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e7f5c 0%, #0d5c36 100%);
        }

        .payment-total span {
          color: white;
          font-size: 1rem;
        }

        .payment-total .amount {
          font-size: 2rem;
          font-weight: 700;
        }

        .payment-error {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          padding: 12px 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          text-align: center;
          font-size: 0.9rem;
        }

        .payment-methods {
          padding: 20px;
        }

        .methods-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .method-btn {
          background: #252538;
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 20px 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .method-btn:hover {
          border-color: var(--method-color);
          background: rgba(255,255,255,0.05);
        }

        .method-icon {
          font-size: 2rem;
        }

        .method-name {
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          text-align: center;
        }

        .cash-section, .qr-section {
          padding: 20px;
        }

        .cash-section h3, .qr-section h3 {
          color: white;
          font-size: 1.25rem;
          margin-bottom: 8px;
          text-align: center;
        }

        .qr-instruction {
          color: #a0a0b0;
          text-align: center;
          margin-bottom: 20px;
        }

        .quick-amounts {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .quick-amounts button {
          flex: 1;
          min-width: 70px;
          background: #252538;
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .quick-amounts button:hover {
          background: #303045;
        }

        .cash-input {
          margin-bottom: 20px;
        }

        .cash-input label {
          display: block;
          color: #a0a0b0;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .cash-input input {
          width: 100%;
          background: #252538;
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px;
          font-size: 1.5rem;
          color: white;
          text-align: center;
        }

        .cash-input input:focus {
          outline: none;
          border-color: #1e7f5c;
        }

        .change-display {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .change-display span {
          color: #a0a0b0;
        }

        .change-display .change-amount {
          color: #22c55e;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .cash-actions, .qr-actions {
          display: flex;
          gap: 12px;
        }

        .btn-back {
          flex: 1;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 14px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        }

        .btn-confirm {
          flex: 2;
          background: #1e7f5c;
          border: none;
          color: white;
          padding: 14px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .qr-container {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin: 20px auto;
          width: fit-content;
        }

        .qr-image {
          width: 200px;
          height: 200px;
        }

        .qr-reference {
          text-align: center;
          margin-bottom: 16px;
        }

        .qr-reference span {
          color: #a0a0b0;
          font-size: 0.9rem;
        }

        .reference-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #252538;
          padding: 8px 16px;
          border-radius: 8px;
          margin-top: 8px;
          color: white;
          font-family: monospace;
          font-size: 1.1rem;
        }

        .reference-box button {
          background: none;
          border: none;
          color: #1e7f5c;
          cursor: pointer;
          padding: 4px;
        }

        .qr-amount {
          text-align: center;
          color: #a0a0b0;
          margin-bottom: 20px;
        }

        .qr-amount strong {
          color: white;
          font-size: 1.25rem;
        }

        .processing-section {
          padding: 60px 20px;
          text-align: center;
        }

        .spinner {
          font-size: 3rem;
          color: #1e7f5c;
          margin-bottom: 20px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .processing-section p {
          color: #a0a0b0;
          font-size: 1rem;
        }

        .success-section {
          padding: 40px 20px;
          text-align: center;
        }

        .success-icon {
          font-size: 4rem;
          color: #22c55e;
          margin-bottom: 20px;
        }

        .success-section h3 {
          color: white;
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .success-section > p {
          color: #a0a0b0;
          margin-bottom: 24px;
        }

        .success-details {
          background: #252538;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row span:first-child {
          color: #a0a0b0;
        }

        .detail-row span:last-child {
          color: white;
          font-weight: 600;
        }

        .detail-row.change span:last-child {
          color: #22c55e;
          font-size: 1.25rem;
        }

        .btn-done {
          width: 100%;
          background: #1e7f5c;
          border: none;
          color: white;
          padding: 16px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
        }
      `}</style>
    </motion.div>
  );
};

export default PaymentModal;
