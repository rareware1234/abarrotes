import { useAuth } from '../context/AuthContext';
import { ROLE_THEME } from '../context/AuthContext';

// Hook simplificado que lee de AuthContext
export function useProfileColor() {
  const { roleTheme, empleado } = useAuth();
  
  // Si hay theme del contexto, lo usamos
  if (roleTheme) {
    return roleTheme;
  }
  
  // Fallback: intentar leer del storage
  const stored = sessionStorage.getItem('desktop_empleado');
  if (stored) {
    try {
      const emp = JSON.parse(stored);
      return ROLE_THEME[emp.rol] || ROLE_THEME.staff;
    } catch {
      // Ignore parse errors
    }
  }
  
  return ROLE_THEME.staff;
}

export function useRoleColor() {
  const profile = useProfileColor();
  return profile.primary;
}

// Mantenemos adjustColor para compatibilidad
export function adjustColor(hex, amount) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}