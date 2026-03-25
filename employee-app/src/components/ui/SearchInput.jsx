import { FaSearch, FaBarcode } from 'react-icons/fa';

export default function SearchInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = "Buscar producto o escanear código...",
  autoFocus = false
}) {
  return (
    <form onSubmit={onSubmit} className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <FaSearch className="text-lg" />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl border-2 border-gray-100 
                   text-base placeholder-gray-400
                   focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                   transition-all duration-200"
      />
      
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl 
                   bg-primary-50 text-primary-500 flex items-center justify-center
                   hover:bg-primary-100 transition-colors"
        onClick={() => {/* TODO: Open scanner */}}
      >
        <FaBarcode className="text-lg" />
      </button>
    </form>
  );
}
