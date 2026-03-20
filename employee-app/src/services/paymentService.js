const MERCADOPAGO_API = 'https://api.mercadopago.com';
const MERCADOPAGO_POINT_API = 'https://api.mercadopago.com/point';

const MERCADOPAGO_ACCESS_TOKEN = 'APP_ACCESS_TOKEN'; // Reemplazar con tu token
const MERCADOPAGO_PUBLIC_KEY = 'APP_PUBLIC_KEY'; // Reemplazar con tu public key

export const paymentService = {
  // ============================================
  // MERCADOPAGO - Cobro con QR
  // ============================================
  
  createPaymentQR: async (amount, description, items) => {
    try {
      const response = await fetch(`${MERCADOPAGO_API}/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          transaction_amount: amount,
          description: description,
          payment_method_id: 'QR_MERCADOPAGO',
          payer: {
            email: 'cliente@ejemplo.com'
          },
          additional_info: {
            items: items.map(item => ({
              id: item.id,
              title: item.nombre,
              description: item.nombre,
              picture_url: '',
              category_id: 'online_services',
              quantity: item.quantity || 1,
              unit_price: item.precio
            }))
          }
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          paymentId: data.id,
          status: data.status,
          qrCode: data.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64
        };
      } else {
        return {
          success: false,
          error: data.message || 'Error al crear pago QR'
        };
      }
    } catch (error) {
      console.error('MercadoPago QR Error:', error);
      return {
        success: false,
        error: 'Error de conexión con MercadoPago'
      };
    }
  },

  // ============================================
  // MERCADOPAGO - Crear orden QR
  // ============================================
  
  createQROrder: async (amount, description, externalReference) => {
    try {
      const response = await fetch(`${MERCADOPAGO_API}/mpmobile/instore/qr/seller/collectors/${MERCADOPAGO_ACCESS_TOKEN}/pos/${externalReference}/qrs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          total_amount: amount,
          external_reference: externalReference,
          items: [
            {
              title: description,
              unit_price: amount,
              quantity: 1
            }
          ]
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          qrCode: data.qr_data,
          qrCodeBase64: data.qr_code_base64
        };
      } else {
        return {
          success: false,
          error: data.message || 'Error al crear QR'
        };
      }
    } catch (error) {
      console.error('MercadoPago QR Order Error:', error);
      return {
        success: false,
        error: 'Error de conexión'
      };
    }
  },

  // ============================================
  // MERCADOPAGO - Cobro con terminal Point
  // ============================================
  
  initiatePointPayment: async (amount, description, externalId) => {
    try {
      const response = await fetch(`${MERCADOPAGO_POINT_API}/integration-api/devices/${externalId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          amount: amount,
          description: description,
          external_reference: externalId,
          payment_method_id: 'debit_card' // o 'credit_card'
        })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        paymentId: data.payment_id,
        status: data.status,
        deviceId: data.device_id
      };
    } catch (error) {
      console.error('MercadoPago Point Error:', error);
      return {
        success: false,
        error: 'Error de conexión con terminal'
      };
    }
  },

  // ============================================
  // MERCADOPAGO -状态查询
  // ============================================
  
  getPaymentStatus: async (paymentId) => {
    try {
      const response = await fetch(`${MERCADOPAGO_API}/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
        }
      });
      
      const data = await response.json();
      
      return {
        success: true,
        status: data.status,
        statusDetail: data.status_detail,
        amount: data.transaction_amount
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al consultar pago'
      };
    }
  },

  // ============================================
  // CoDi - Cobro vía SPEI (BANXICO)
  // ============================================
  
  createCoDiPayment: async (amount, concept, reference) => {
    try {
      // CoDi requiere configuración con banco
      // Este es un ejemplo de la estructura
      
      const codiData = {
        monto: amount,
        concepto: concept,
        referenciaNumerica: reference.toString().padStart(7, '0'),
        vencimiento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        urlNotificacion: 'https://tu-servidor.com/api/codi-callback'
      };
      
      // Generar CVE SAT simplificada
      const cveSAT = generateCVESAT();
      
      return {
        success: true,
        tipoPago: 'CoDi',
        monto: amount,
        concepto: concept,
        referencia: reference,
        cveSAT: cveSAT,
        qrCode: generateCoDiQR(amount, reference, cveSAT),
        mensaje: 'Muestra este QR al cliente para que pague desde su app bancaria'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error al crear pago CoDi'
      };
    }
  },

  // ============================================
  // Efectivo - Cambio y registro
  // ============================================
  
  processCashPayment: (amount, cashReceived) => {
    const change = cashReceived - amount;
    
    if (change < 0) {
      return {
        success: false,
        error: 'Monto insuficiente'
      };
    }
    
    return {
      success: true,
      amount: amount,
      cashReceived: cashReceived,
      change: change,
      tipoPago: 'Efectivo'
    };
  }
};

// ============================================
// Funciones auxiliares
// ============================================

const generateCVESAT = () => {
  // Genera una CVE SAT de 6 dígitos (simplificado)
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateCoDiQR = (monto, referencia, cveSAT) => {
  // Generar QR para CoDi (basado en formato SPEI/BANXICO)
  // Este es un placeholder - necesita integración real con banco
  const datosQR = {
    mnt: monto,
    ref: referencia,
    cv: cveSAT,
    em: 'Abarrotes Digitales'
  };
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(datosQR))}`;
};

// ============================================
// Tipos de pago disponibles
// ============================================

export const PAYMENT_METHODS = {
  EFECTIVO: {
    id: 'efectivo',
    nombre: 'Efectivo',
    icono: '💵',
    color: '#22c55e',
    requiereMonto: true
  },
  TARJETA_CREDITO: {
    id: 'tarjeta_credito',
    nombre: 'Tarjeta de Crédito',
    icono: '💳',
    color: '#3b82f6',
    requiereTerminal: true
  },
  TARJETA_DEBITO: {
    id: 'tarjeta_debito',
    nombre: 'Tarjeta de Débito',
    icono: '💳',
    color: '#6366f1',
    requiereTerminal: true
  },
  MERCADOPAGO_QR: {
    id: 'mercadopago_qr',
    nombre: 'MercadoPago QR',
    icono: '📱',
    color: '#00b1ea',
    requiereQR: true
  },
  CODI: {
    id: 'codi',
    nombre: 'CoDi',
    icono: '📲',
    color: '#f59e0b',
    requiereQR: true
  },
  TRANSFERENCIA: {
    id: 'transferencia',
    nombre: 'Transferencia',
    icono: '🏦',
    color: '#10b981',
    requiereComprobante: true
  }
};

// ============================================
// Servicio mock para pruebas (sin API real)
// ============================================

export const mockPaymentService = {
  processPayment: async (method, amount) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      tipoPago: method.nombre,
      monto: amount,
      referencia: `REF-${Date.now()}`,
      fecha: new Date().toISOString(),
      mensaje: `Pago con ${method.nombre} exitoso`
    };
  },
  
  generateQR: async (method, amount) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const reference = Math.floor(1000000 + Math.random() * 9000000);
    
    return {
      success: true,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(method.id + '-' + amount + '-' + reference)}`,
      monto: amount,
      referencia: reference.toString(),
      mensaje: `Escanea el QR para pagar con ${method.nombre}`
    };
  }
};
