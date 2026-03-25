import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f6f9',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#f8d7da',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <i className="bi bi-exclamation-triangle" style={{
                fontSize: '32px',
                color: '#dc3545'
              }}></i>
            </div>
            <h4 style={{ color: '#dc3545', marginBottom: '12px' }}>
              Algo salió mal
            </h4>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Ocurrió un error al cargar esta página. Intenta recargar.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#00843D',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Recargar página
            </button>
            {this.state.error && (
              <details style={{
                marginTop: '20px',
                textAlign: 'left',
                fontSize: '12px',
                color: '#999'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Detalles del error
                </summary>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '11px'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
