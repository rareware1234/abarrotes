import { FaShoppingCart, FaBox, FaChartBar, FaUser } from 'react-icons/fa';

const navItems = [
  { icon: FaShoppingCart, label: 'Venta', path: '/pos' },
  { icon: FaBox, label: 'Productos', path: '/productos' },
  { icon: FaChartBar, label: 'Reportes', path: '/reportes' },
  { icon: FaUser, label: 'Perfil', path: '/perfil' },
];

export default function BottomNav({ currentPath, onNavigate }) {
  const isActive = (path) => {
    if (path === '/pos') return currentPath === '/pos' || currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                active 
                  ? 'text-primary-500' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                active ? 'bg-primary-50' : ''
              }`}>
                <Icon className={`text-xl ${active ? '' : 'opacity-70'}`} />
              </div>
              <span className={`text-xs font-medium ${active ? '' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
