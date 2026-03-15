import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const Configuracion = () => {
  const [config, setConfig] = useState({
    clabeInterbancaria: '',
    nombreEmpresa: '',
    banco: '',
    regimenFiscal: '612',
    lugarExpedicion: '06000',
    rfcEmpresa: '',
    direccionEmpresa: '',
    bannerUrl: '',
    bannerText: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Cargar configuración existente
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // En producción, esto sería una llamada a la API
      // Por ahora, usamos datos de ejemplo o localStorage
      const savedConfig = localStorage.getItem('sistemaConfig');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      } else {
        // Configuración por defecto
        setConfig({
          clabeInterbancaria: '044185002754631919',
          nombreEmpresa: 'Abarrotes Digitales',
          banco: 'BBVA',
          regimenFiscal: '612',
          lugarExpedicion: '06000',
          rfcEmpresa: 'AAD980314XXX',
          direccionEmpresa: 'Av. Principal #123, Col. Centro, CDMX',
          bannerUrl: 'https://via.placeholder.com/800x400/006241/ffffff?text=¡Bienvenido+a+Abarrotes+Digitales!',
          bannerText: '¡Bienvenido a Abarrotes Digitales!'
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor selecciona un archivo de imagen válido' });
        return;
      }

      // Validar tamaño (máximo 2MB antes de optimizar)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB' });
        return;
      }

      // Leer el archivo como Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        // Crear una imagen para optimizar
        const img = new Image();
        img.onload = () => {
          // Crear un canvas para optimizar la imagen
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calcular nuevas dimensiones (máximo 800px de ancho)
          const maxWidth = 800;
          const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Dibujar la imagen optimizada
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convertir a Data URL con compresión
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Actualizar el estado con la imagen optimizada
          setConfig(prev => ({
            ...prev,
            bannerUrl: optimizedDataUrl
          }));
          setMessage({ type: 'success', text: 'Imagen optimizada y cargada correctamente' });
          setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        };
        
        img.onerror = () => {
          setMessage({ type: 'error', text: 'Error al procesar la imagen' });
        };
        
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // En producción, esto sería una llamada a la API del backend
      // api.post('/api/configuracion', config)
      
      // Verificar el tamaño de la configuración antes de guardar
      const configString = JSON.stringify(config);
      const configSize = new Blob([configString]).size;
      
      if (configSize > 4 * 1024 * 1024) { // 4MB límite aproximado
        setMessage({ type: 'error', text: 'La configuración es demasiado grande. Intenta con una imagen más pequeña.' });
        return;
      }
      
      // Por ahora, guardamos en localStorage
      localStorage.setItem('sistemaConfig', configString);
      
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    }
  };

  if (loading) {
    return (
      <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted mt-3">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 d-flex flex-column" style={{ backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-white shadow-sm">
        <div className="d-flex align-items-center">
          <img src="/src/assets/logo.png" alt="Logo" style={{ height: '40px', marginRight: '15px' }} />
          <h4 className="mb-0 fw-bold text-dark">Configuración del Sistema</h4>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow-1 p-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            {/* Mensaje de resultado */}
            {message.text && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
              </div>
            )}

            <div className="card shadow">
              <div className="card-header" style={{ backgroundColor: '#006241', color: 'white' }}>
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i> Configuración de Facturación
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSave}>
                  {/* Sección de CLABE Interbancaria */}
                  <h6 className="fw-bold mb-3" style={{ color: '#006241' }}>
                    <i className="bi bi-qr-code me-2"></i> Información Bancaria
                  </h6>
                  
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">CLABE Interbancaria</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="clabeInterbancaria"
                        value={config.clabeInterbancaria}
                        onChange={handleInputChange}
                        placeholder="18 dígitos"
                        maxLength="18"
                        pattern="[0-9]{18}"
                        required
                      />
                      <small className="text-muted">CLABE de 18 dígitos para transferencias</small>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Banco</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="banco"
                        value={config.banco}
                        onChange={handleInputChange}
                        placeholder="Nombre del banco"
                        required
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Nombre del Beneficiario</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="nombreEmpresa"
                        value={config.nombreEmpresa}
                        onChange={handleInputChange}
                        placeholder="Nombre de la empresa o persona"
                        required
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Sección de Información Fiscal */}
                  <h6 className="fw-bold mb-3" style={{ color: '#006241' }}>
                    <i className="bi bi-file-earmark-text me-2"></i> Información Fiscal
                  </h6>
                  
                  <div className="row mb-4">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">RFC de la Empresa</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="rfcEmpresa"
                        value={config.rfcEmpresa}
                        onChange={handleInputChange}
                        placeholder="AAA990101XXX"
                        maxLength="13"
                        required
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Régimen Fiscal</label>
                      <select 
                        className="form-select" 
                        name="regimenFiscal"
                        value={config.regimenFiscal}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="601">601 - General de Ley Personas Morales</option>
                        <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                        <option value="605">605 - Sueldos y Salarios</option>
                        <option value="606">606 - Arrendamiento</option>
                        <option value="608">608 - Demás ingresos</option>
                        <option value="610">610 - Actividades Agrícolas, Ganaderas, Silvícolas</option>
                        <option value="611">611 - Ingresos por Dividendos</option>
                        <option value="612">612 - Personas Físicas con Actividades Empresariales</option>
                        <option value="614">614 - Ingresos por Intereses</option>
                        <option value="615">615 - Secundaria de Actividades Empresariales</option>
                        <option value="616">616 - Sin obligaciones fiscales</option>
                        <option value="620">620 - Sociedades Cooperativas de Producción</option>
                        <option value="621">621 - Incorporación Fiscal</option>
                        <option value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                        <option value="623">623 - Opcional para Grupos de Sociedades</option>
                        <option value="624">624 - Coordinados</option>
                        <option value="625">625 - Régimen de Enajenación o Adquisición de Bienes</option>
                        <option value="626">626 - De los Notarios Públicos</option>
                        <option value="627">627 - De los Enajenantes de Bienes Inmuebles</option>
                        <option value="628">628 - De los Enajenantes de Bienes Muebles</option>
                        <option value="629">629 - De los Enajenantes de Bienes Inmuebles</option>
                      </select>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Lugar de Expedición (Código Postal)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="lugarExpedicion"
                        value={config.lugarExpedicion}
                        onChange={handleInputChange}
                        placeholder="06000"
                        maxLength="5"
                        required
                      />
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Dirección Fiscal</label>
                      <textarea 
                        className="form-control" 
                        name="direccionEmpresa"
                        value={config.direccionEmpresa}
                        onChange={handleInputChange}
                        placeholder="Dirección completa de la empresa"
                        rows="2"
                        required
                      ></textarea>
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Sección de Banner de Pantalla del Cliente */}
                  <h6 className="fw-bold mb-3" style={{ color: '#006241' }}>
                    <i className="bi bi-image me-2"></i> Banner de Pantalla del Cliente
                  </h6>
                  
                  <div className="row mb-4">
                    <div className="col-12 mb-3">
                      <label className="form-label">URL de la Imagen del Banner</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control" 
                          name="bannerUrl"
                          value={config.bannerUrl}
                          onChange={handleInputChange}
                          placeholder="https://ejemplo.com/imagen-banner.jpg"
                        />
                        <input 
                          type="file" 
                          className="form-control" 
                          accept="image/*"
                          onChange={handleFileUpload}
                          style={{ maxWidth: '150px' }}
                        />
                      </div>
                      <small className="text-muted">Pega una URL o selecciona un archivo desde tu equipo</small>
                    </div>
                    
                    <div className="col-12 mb-3">
                      <label className="form-label">Texto del Banner</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        name="bannerText"
                        value={config.bannerText}
                        onChange={handleInputChange}
                        placeholder="¡Bienvenido a nuestra tienda!"
                      />
                      <small className="text-muted">Texto que se mostrará debajo del banner</small>
                    </div>
                  </div>

                  <div className="text-end">
                    <button type="submit" className="btn btn-primary btn-lg" style={{ backgroundColor: '#006241', borderColor: '#006241' }}>
                      <i className="bi bi-save me-2"></i> Guardar Configuración
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Información adicional */}
            <div className="card shadow mt-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">
                  <i className="bi bi-info-circle me-2"></i> Información
                </h6>
                <ul className="text-muted small mb-0">
                  <li>La CLABE interbancaria se mostrará en un código QR cuando los clientes seleccionen "Transferencia" como método de pago.</li>
                  <li>La información fiscal se utiliza para generar los CFDIs (Comprobantes Fiscales Digitales).</li>
                  <li>Esta configuración se almacena localmente en este dispositivo. En producción, se recomienda almacenarla en una base de datos.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;
