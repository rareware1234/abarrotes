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
    console.error('Error caught by boundary:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Log error details to console for debugging
      console.error('Error Boundary caught an error:', this.state.error);
      
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4">
          <div className="text-center">
            <div className="mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
            <h2 className="h5 mb-3">Algo salió mal</h2>
            <p className="text-muted mb-3">
              Por favor, intenta recargar la página o contacta al soporte.
            </p>
            <details style={{ textAlign: 'left', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>
              <summary>Detalles del error (para soporte)</summary>
              {this.state.error && this.state.error.toString()}
            </details>
            <button
              className="btn btn-primary"
              style={{ backgroundColor: '#1e7f5c', borderColor: '#1e7f5c' }}
              onClick={() => window.location.reload()}
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;