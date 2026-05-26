import React, { useRef, useEffect } from 'react';
import { FaBarcode, FaCamera, FaTrash, FaShoppingCart } from 'react-icons/fa';

const POSMobileLayout = ({
  cart,
  updateCart,
  onCheckout,
  onClearCart,
  scanCode,
  setScanCode,
  suggestions,
  showSuggestions,
  onSearch,
  onAddProduct,
  onSelectSuggestion,
  employeeName
}) => {
  const inputRef = useRef(null);

  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      updateCart(cart.filter(i => i.id !== id));
    } else {
      updateCart(cart.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* BARRA DE BÚSQUEDA STICKY */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#f4f7f6',
        padding: '10px 12px 8px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          border: '1.5px solid #e2e8f0',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#00843D';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,132,61,0.12)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        }}>
          <div style={{ padding: '0 10px', color: '#6b7c93', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <FaBarcode size={17} />
          </div>

          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={scanCode}
            onChange={(e) => { setScanCode(e.target.value); onSearch(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); onAddProduct(); }
              if (e.key === 'Escape') { setScanCode(''); onSearch(''); }
            }}
            placeholder="Escanear código o buscar producto..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1,
              height: 46,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              background: 'transparent',
              color: '#1a2b3c',
              padding: '0 4px',
              minWidth: 0
            }}
          />

          <button
            onClick={() => alert('Cámara en desarrollo')}
            style={{
              width: 44, height: 46,
              border: 'none',
              borderLeft: '1px solid #e2e8f0',
              background: 'transparent',
              color: '#6b7c93',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FaCamera size={15} />
          </button>

          <button
            onClick={onAddProduct}
            style={{
              height: 46, padding: '0 16px',
              background: '#00843D',
              color: 'white',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              borderRadius: '0 10px 10px 0',
              whiteSpace: 'nowrap'
            }}
          >
            Agregar
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 12, right: 12,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 200,
            overflow: 'hidden',
            maxHeight: 260,
            overflowY: 'auto'
          }}>
            {suggestions.slice(0, 6).map((p) => (
              <div
                key={p.id || p.sku}
                onClick={() => { onSelectSuggestion(p); setScanCode(''); onSearch(''); }}
                style={{
                  padding: '11px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2b3c', marginBottom: 2 }}>
                  {p.nombreProducto || p.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>{p.sku}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#00843D' }}>
                    ${(p.precio || p.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div style={{ padding: '12px 12px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaShoppingCart size={16} color="#00843D" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a2b3c' }}>Artículos</span>
          <span style={{
            background: '#e8f5ec', color: '#00843D',
            borderRadius: 20, padding: '2px 10px',
            fontSize: 12, fontWeight: 700
          }}>
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          border: '1px solid #f1f5f9'
        }}>
          {cart.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '44px 16px', gap: 8, color: '#9ca3af'
            }}>
              <FaShoppingCart size={44} style={{ opacity: 0.25 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#6b7c93' }}>
                El carrito está vacío
              </p>
              <span style={{ fontSize: 13 }}>Escanea un producto para comenzar</span>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  padding: '12px 14px',
                  borderBottom: idx < cart.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2b3c', lineHeight: 1.3 }}>
                      {item.name || item.nombreProducto}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      ${(item.price || 0).toFixed(2)} c/u
                    </div>
                  </div>
                  <button
                    onClick={() => updateCart(cart.filter(i => i.id !== item.id))}
                    style={{
                      width: 30, height: 30,
                      border: 'none',
                      background: '#fff5f5',
                      borderRadius: 8,
                      color: '#dc3545',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      width: 34, height: 34,
                      border: '1.5px solid #e2e8f0',
                      background: 'white', borderRadius: 8,
                      fontSize: 18, fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: '#1a2b3c'
                    }}
                  >−</button>

                  <span style={{
                    minWidth: 36, textAlign: 'center',
                    fontSize: 16, fontWeight: 700, color: '#1a2b3c'
                  }}>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      width: 34, height: 34,
                      border: '1.5px solid #e2e8f0',
                      background: 'white', borderRadius: 8,
                      fontSize: 18, fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, color: '#1a2b3c'
                    }}
                  >+</button>

                  <span style={{ flex: 1, textAlign: 'right', fontSize: 15, fontWeight: 700, color: '#00843D' }}>
                    ${((item.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RESUMEN DE VENTA - FLUYE CON SCROLL */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #f1f5f9'
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1a2b3c' }}>
            Resumen de Venta
          </p>

          {[
            { label: 'Subtotal', value: subtotal },
            { label: 'IVA (16%)', value: iva }
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '7px 0', borderBottom: '1px solid #f1f5f9',
              fontSize: 14, color: '#4b5563'
            }}>
              <span>{label}</span>
              <span>${value.toFixed(2)}</span>
            </div>
          ))}

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0 4px',
            fontSize: 18, fontWeight: 800
          }}>
            <span style={{ color: '#1a2b3c' }}>Total</span>
            <span style={{ color: '#00843D' }}>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => cart.length > 0 && onCheckout()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', height: 52,
              background: '#1B5E35',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16, fontWeight: 700,
              marginTop: 14,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
              transition: 'background 0.2s, transform 0.1s, opacity 0.2s',
              letterSpacing: 0.3
            }}
          >
            Cobrar {cart.length > 0 ? `$${total.toFixed(2)}` : ''}
          </button>

          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              style={{
                width: '100%', height: 42,
                background: 'transparent',
                color: '#dc3545',
                border: '1.5px solid #dc3545',
                borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                marginTop: 10,
                cursor: 'pointer'
              }}
            >
              Nueva Venta
            </button>
          )}

          {employeeName && (
            <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
              Empleado: <strong style={{ color: '#6b7c93' }}>{employeeName}</strong>
            </p>
          )}
        </div>

      </div>
    </>
  );
};

export default POSMobileLayout;
