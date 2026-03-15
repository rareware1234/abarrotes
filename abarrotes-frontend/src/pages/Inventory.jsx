import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { useDropzone } from 'react-dropzone';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Estado para el formulario de recepción
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    unitCost: '',
    expiryDate: ''
  });

  // URL de imagen genérica de leche con fondo transparente
  const genericMilkImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/White_Milk.jpg/1200px-White_Milk.jpg';

  useEffect(() => {
    fetchInventory();
    fetchProducts();
  }, []);

  const fetchInventory = async () => {
    try {
      // Como no hay un endpoint único para todo el inventario, 
      // vamos a obtener los productos y calcular el stock disponible para cada uno.
      const response = await api.get('/products');
      
      // Para cada producto, obtenemos el stock disponible
      const inventoryData = await Promise.all(
        response.data.map(async (product) => {
          try {
            const stockResponse = await api.get(`/inventory/stock/${product.id}`);
            return {
              ...product,
              availableStock: stockResponse.data
            };
          } catch (error) {
            return {
              ...product,
              availableStock: 0
            };
          }
        })
      );
      
      setInventory(inventoryData);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmitReception = async (e) => {
    e.preventDefault();
    try {
      // Construir la URL con query parameters como espera el backend
      const params = new URLSearchParams({
        productId: formData.productId,
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        expiryDate: formData.expiryDate + 'T00:00:00' // Añadir hora para formato correcto
      });

      await api.post(`/inventory/receive?${params.toString()}`);
      alert('Entrada de inventario registrada exitosamente');
      setShowModal(false);
      fetchInventory(); // Recargar lista
      setFormData({ productId: '', quantity: '', unitCost: '', expiryDate: '' });
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      alert('Error al registrar la entrada. Revisa la consola.');
    }
  };

  // Función para manejar la subida de imágenes
  const handleImageUpload = async () => {
    if (!selectedProduct || !imagePreview) return;
    
    setUploading(true);
    try {
      // En producción, aquí subiríamos la imagen al servidor
      // Por ahora, guardamos en localStorage
      const productImages = JSON.parse(localStorage.getItem('productImages') || '{}');
      productImages[selectedProduct.id] = imagePreview;
      localStorage.setItem('productImages', JSON.stringify(productImages));
      
      alert('Imagen guardada exitosamente');
      setShowImageModal(false);
      setImagePreview(null);
      setSelectedProduct(null);
      fetchInventory(); // Recargar lista para mostrar la nueva imagen
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  // Configuración de Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
    maxSize: 5242880 // 5MB
  });

  // Función para abrir modal de imagen
  const openImageModal = (product) => {
    setSelectedProduct(product);
    setShowImageModal(true);
    // Cargar imagen existente si la hay
    const productImages = JSON.parse(localStorage.getItem('productImages') || '{}');
    if (productImages[product.id]) {
      setImagePreview(productImages[product.id]);
    } else {
      setImagePreview(null);
    }
  };

  // Función para obtener la imagen del producto
  const getProductImage = (productId) => {
    const productImages = JSON.parse(localStorage.getItem('productImages') || '{}');
    return productImages[productId] || genericMilkImage;
  };

  if (loading) return <div className="p-4">Cargando inventario...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Inventario</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="bi bi-box-arrow-in-down"></i> Registrar Entrada
        </button>
      </div>

      {/* Tabla de Inventario */}
      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light text-primary">
              <tr>
                <th style={{ width: '80px' }}>Imagen</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="text-end">Stock Disponible</th>
                <th className="text-end">Stock Mínimo</th>
                <th className="text-end">Stock Máximo</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id}>
                  <td className="text-center">
                    <img 
                      src={getProductImage(item.id)} 
                      alt={item.name}
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}
                      onError={(e) => {
                        e.target.src = genericMilkImage;
                      }}
                    />
                  </td>
                  <td>
                    <strong>{item.name}</strong><br/>
                    <small className="text-muted">SKU: {item.sku}</small>
                  </td>
                  <td>{item.category}</td>
                  <td className="text-end fw-bold">{item.availableStock}</td>
                  <td className="text-end">{item.minStock}</td>
                  <td className="text-end">{item.maxStock}</td>
                  <td className="text-center">
                    {item.availableStock < item.minStock ? (
                      <span className="badge bg-danger">Stock Bajo</span>
                    ) : (
                      <span className="badge bg-success">Normal</span>
                    )}
                  </td>
                  <td className="text-center">
                    <button 
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => openImageModal(item)}
                      title="Subir imagen"
                    >
                      <i className="bi bi-image"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Registrar Entrada */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Registrar Entrada de Inventario</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmitReception}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Producto</label>
                    <select className="form-select" name="productId" value={formData.productId} onChange={handleInputChange} required>
                      <option value="">Seleccionar producto...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">Cantidad</label>
                      <input type="number" className="form-control" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Costo Unitario ($)</label>
                      <input type="number" step="0.01" className="form-control" name="unitCost" value={formData.unitCost} onChange={handleInputChange} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Fecha de Caducidad</label>
                      <input type="date" className="form-control" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Registrar Entrada</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Subir Imagen */}
      {showImageModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-image me-2"></i> Subir Imagen - {selectedProduct?.name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowImageModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* Vista previa de la imagen actual */}
                {imagePreview && (
                  <div className="text-center mb-3">
                    <p className="text-muted small mb-2">Vista previa:</p>
                    <img 
                      src={imagePreview} 
                      alt="Vista previa"
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px',
                        borderRadius: '8px',
                        border: '2px solid #dee2e6'
                      }}
                    />
                  </div>
                )}

                {/* Área de Dropzone */}
                <div 
                  {...getRootProps()} 
                  className={`border-2 rounded p-4 text-center ${isDragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                  style={{ 
                    borderStyle: 'dashed',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? '#f8f9fa' : '#fafafa'
                  }}
                >
                  <input {...getInputProps()} />
                  <i className="bi bi-cloud-arrow-up display-4 text-muted mb-2"></i>
                  <p className="mb-0">
                    {isDragActive 
                      ? 'Suelta la imagen aquí...' 
                      : 'Arrastra y suelta una imagen aquí, o haz clic para seleccionar'}
                  </p>
                  <small className="text-muted">PNG, JPG, GIF hasta 5MB</small>
                </div>

                {/* Información del producto */}
                <div className="mt-3 p-2 bg-light rounded">
                  <p className="mb-1"><strong>Producto:</strong> {selectedProduct?.name}</p>
                  <p className="mb-0"><strong>SKU:</strong> {selectedProduct?.sku}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowImageModal(false)}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleImageUpload}
                  disabled={!imagePreview || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Guardar Imagen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
