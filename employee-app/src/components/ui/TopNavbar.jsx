import { FaBell, FaUserCircle, FaChevronDown, FaSignOutAlt, FaCog } from 'react-icons/fa';

export default function TopNavbar({ user, onLogout }) {
  const [showDropdown, setShowDropdown] = React.useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-primary-500 text-white">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-xl font-bold">A</span>
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">Abarrotes Digitales</h1>
            <p className="text-xs text-white/70">Sucursal Principal</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors relative">
            <FaBell className="text-lg" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Avatar */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary-400 flex items-center justify-center text-sm font-semibold">
                {getInitials(user?.name)}
              </div>
              <FaChevronDown className="text-xs text-white/70" />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg z-20 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{user?.name || 'Usuario'}</p>
                    <p className="text-sm text-gray-500">{user?.email || 'email@ejemplo.com'}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                      <FaUserCircle className="text-lg text-gray-400" />
                      <span>Mi Perfil</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                      <FaCog className="text-lg text-gray-400" />
                      <span>Configuración</span>
                    </button>
                    <button 
                      onClick={() => { setShowDropdown(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FaSignOutAlt className="text-lg" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

import React from 'react';
