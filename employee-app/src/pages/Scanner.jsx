import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaBarcode, FaTimes, FaCamera } from 'react-icons/fa';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseAuth';

const Scanner = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    loadProducts();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(products.slice(0, 30));
    } else {
      const term = search.toLowerCase();
      setFiltered(products.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.sku || '').toLowerCase().includes(term) ||
        (p.barcode || '').toLowerCase().includes(term)
      ).slice(0, 30));
    }
  }, [search, products]);

  const loadProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'productos'));
      if (!snapshot.empty) {
        const data = snapshot.docs.map(d => {
          const p = d.data();
          return {
            id: d.id,
            name: p.nombre || p.name || 'Sin nombre',
            price: parseFloat(p.precio || p.price || 0),
            sku: p.sku || p.barcode || '',
            barcode: p.barcode || p.sku || '',
            category: p.categoria || p.category || '',
            stock: p.stock || 999,
            description: p.descripcion || ''
          };
        });
        setProducts(data);
        setFiltered(data.slice(0, 30));
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (e) {
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleBarcode = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      const term = search.trim().toLowerCase();
      const found = products.find(p =>
        (p.sku || '').toLowerCase() === term ||
        (p.barcode || '').toLowerCase() === term
      );
      if (found) {
        setSelected(found);
        setSearch('');
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Sin stock', color: 'var(--danger)', bg: '#fee2e2' };
    if (stock <= 5) return { label: 'Stock bajo', color: 'var(--warning)', bg: '#fef3c7' };
    return { label: 'Disponible', color: 'var(--success)', bg: '#dcfce7' };
  };

  const CATEGORIES = ['Todos', 'Abarrotes', 'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Higiene'];
  const [activeCat, setActiveCat] = useState('Todos');

  const byCategory = (p) => {
    if (activeCat === 'Todos') return true;
    return p.category === activeCat;
  };

  const displayed = filtered.filter(byCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
      <div className="search-bar">
        <FaSearch className="search-bar-icon" />
        <input
          ref={searchRef}
          type="text"
          className="form-control"
          placeholder="Código de barras o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleBarcode}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className={`btn ${cameraActive ? 'btn-danger' : 'btn-primary'} btn-block`}
          onClick={cameraActive ? stopCamera : startCamera}
        >
          <FaCamera /> {cameraActive ? 'Detener' : 'Cámara'}
        </button>
      </div>

      {cameraActive && (
        <div className="scanner-viewfinder" style={{ maxWidth: '100%' }}>
          <video ref={videoRef} className="scanner-video" autoPlay playsInline muted />
          <div className="scanner-overlay-frame">
            <div className="scanner-corners">
              <div className="scanner-corner scanner-corner-tl"></div>
              <div className="scanner-corner scanner-corner-tr"></div>
              <div className="scanner-corner scanner-corner-bl"></div>
              <div className="scanner-corner scanner-corner-br"></div>
              <div className="scanner-scan-line"></div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="card fade-up">
          <div className="card-header-section">
            <h3 className="card-title">Producto encontrado</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
              <FaTimes size={14} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, background: 'var(--primary-muted)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', color: 'var(--primary)', flexShrink: 0
            }}>
              <FaBarcode />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)', marginBottom: 4 }}>{selected.name}</div>
              {selected.sku && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 4 }}>
                  SKU: {selected.sku}
                </div>
              )}
              {selected.description && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  {selected.description}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>
                  ${(selected.price * 1.16).toFixed(2)}
                </span>
                <span className="badge" style={{
                  background: getStockStatus(selected.stock).bg,
                  color: getStockStatus(selected.stock).color
                }}>
                  {getStockStatus(selected.stock).label} ({selected.stock} pzs)
                </span>
                {selected.category && (
                  <span className="badge badge-muted">{selected.category}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!search && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`btn btn-sm ${activeCat === cat ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setActiveCat(cat)}
              style={{ flexShrink: 0 }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <FaBarcode />
          <h4>Sin resultados</h4>
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {displayed.map(p => {
            const stock = getStockStatus(p.stock);
            return (
              <div
                key={p.id}
                className="list-item fade-up"
                onClick={() => setSelected(p)}
                style={{ cursor: 'pointer', borderRadius: 'var(--radius-md)', marginBottom: '4px' }}
              >
                <div className="list-item-icon" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                  <FaBarcode />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{p.name}</div>
                  <div className="list-item-subtitle">
                    {p.sku || p.barcode ? `SKU: ${p.sku || p.barcode}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                    ${(p.price * 1.16).toFixed(0)}
                  </span>
                  <span className="badge" style={{ background: stock.bg, color: stock.color, fontSize: '0.65rem' }}>
                    {stock.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Scanner;
