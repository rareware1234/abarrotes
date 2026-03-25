import { FaPlus, FaMinus, FaTrash } from 'react-icons/fa';

export default function ProductItem({ 
  producto, 
  cantidad, 
  onIncrement, 
  onDecrement, 
  onRemove 
}) {
  const subtotal = producto.precio * cantidad;

  return (
    <div className="flex items-center gap-3 py-3 px-4 bg-white rounded-xl shadow-sm">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{producto.nombre}</h4>
        <p className="text-sm text-gray-500">${producto.precio.toFixed(2)} c/u</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDecrement}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {cantidad === 1 ? <FaTrash className="text-sm" /> : <FaMinus className="text-sm" />}
        </button>
        
        <span className="w-10 text-center font-semibold text-lg">
          {cantidad}
        </span>
        
        <button
          onClick={onIncrement}
          className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
        >
          <FaPlus className="text-sm" />
        </button>
      </div>

      {/* Subtotal */}
      <div className="text-right min-w-[80px]">
        <p className="font-bold text-gray-900">${subtotal.toFixed(2)}</p>
      </div>
    </div>
  );
}
