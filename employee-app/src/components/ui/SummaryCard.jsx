import { FaShoppingCart, FaPercent, FaUser } from 'react-icons/fa';

export default function SummaryCard({ 
  total, 
  productos = 0, 
  descuento = 0, 
  cliente = null,
  onCobrar,
  onDescuento,
  loading = false
}) {
  return (
    <div className="mp-card mb-4">
      {/* Header */}
      <div className="mp-card-header">
        <div>
          <p className="text-sm text-gray-500">Total a pagar</p>
          <h2 className="mp-amount">${total.toFixed(2)}</h2>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center">
          <span className="text-2xl">💰</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FaShoppingCart className="text-gray-400" />
            <span>Productos</span>
          </div>
          <span className="font-medium text-gray-900">{productos}</span>
        </div>

        {descuento > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FaPercent className="text-gray-400" />
              <span>Descuento</span>
            </div>
            <span className="font-medium text-green-600">-${descuento.toFixed(2)}</span>
          </div>
        )}

        {cliente && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <FaUser className="text-gray-400" />
              <span>Cliente</span>
            </div>
            <span className="font-medium text-gray-900">{cliente}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button 
          onClick={onCobrar}
          disabled={loading || productos === 0}
          className="mp-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Procesando...' : 'Cobrar'}
        </button>
        
        {descuento > 0 && (
          <button 
            onClick={onDescuento}
            className="mp-btn-ghost w-full text-sm"
          >
            Quitar descuento
          </button>
        )}
      </div>
    </div>
  );
}
