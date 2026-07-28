import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, aplicarTemaRol } from './AuthContext';
import empresaService from '../services/empresaService';
import { rgbHex } from '../data/formatos';
import {
  getActivaId, setActivaId as persistActiva, DEFAULT_EMPRESA_ID,
} from '../lib/empresaActiva';
import {
  syncEmpresaActiva, resolveTheme, THEMES, brandInk, empresaColor, empresaColorDark,
  resolveToken, usesPaletteColors,
} from '../lib/empresaTheme';
import { brandColor } from '../lib/brandRoles';

// Empresa "default" sintética — réplica de EmpresaStore.defaultEmpresaLocal.
// Garantiza que el portal/panel siempre tenga al menos un card.
export const DEFAULT_EMPRESA_LOCAL = {
  id: DEFAULT_EMPRESA_ID,
  nombre: 'Punto Verde',
  giro: 'Supermercado',
  tagline: 'Tienda de barrio y supermercado',
  colorR: 0.059, colorG: 0.302, colorB: 0.180, brightness: 0,
  activa: true,
};

const EmpresaContext = createContext(null);
export const useEmpresa = () => useContext(EmpresaContext);

const ensureDefault = (arr) =>
  arr.some(e => e.id === DEFAULT_EMPRESA_ID) ? arr : [DEFAULT_EMPRESA_LOCAL, ...arr];

export const EmpresaProvider = ({ children }) => {
  const { empleado } = useAuth();
  const [empresas, setEmpresas] = useState([DEFAULT_EMPRESA_LOCAL]);
  const [activaId, setActivaIdState] = useState(() => getActivaId());
  const [requestPicker, setRequestPicker] = useState(false);

  // Carga del listado (web no tiene snapshot listener; fetch puntual).
  const reload = useCallback(async () => {
    try {
      const res = await empresaService.fetchAll();
      if (res.success) setEmpresas(ensureDefault(res.data));
    } catch { /* mantiene la default local */ }
    // Asegurar el doc default en segundo plano (no bloquea).
    empresaService.asegurarDefault()
      .then((r) => (r?.success ? empresaService.fetchAll() : null))
      .then((r) => { if (r?.success) setEmpresas(ensureDefault(r.data)); })
      .catch(() => {});
  }, []);

  useEffect(() => { if (empleado) reload(); }, [empleado, reload]);

  // Auto-selección de empresa activa según el empleado que entra (§8 guía
  // de branding): corrige "empresa equivocada" cuando activaId quedó de
  // otra cuenta en este dispositivo.
  useEffect(() => {
    if (!empleado) return;
    syncEmpresaActiva(empleado, activaId, setActiva);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleado, empresas]);

  const empresaActiva =
    empresas.find(e => e.id === activaId) ||
    empresas.find(e => e.id === DEFAULT_EMPRESA_ID) ||
    empresas[0] || DEFAULT_EMPRESA_LOCAL;

  const setActiva = useCallback((id) => {
    persistActiva(id);
    setActivaIdState(id || DEFAULT_EMPRESA_ID);
  }, []);

  // Tema "ventana" por empresa — réplica de managerAdminGradient (Swift):
  // un admin/manager en una empresa custom pinta toda la app con su color;
  // en la default (o staff) se respeta el tema del rol.
  useEffect(() => {
    if (!empleado) return;
    const isDefault = !empresaActiva || empresaActiva.id === DEFAULT_EMPRESA_ID;
    const themable = empleado.rol === 'admin' || empleado.rol === 'manager';
    const root = document.documentElement;
    if (isDefault || !themable) {
      aplicarTemaRol(empleado.rol);   // restaura tema del rol
      return;
    }
    // brandAccent app-wide (doc §8): si la empresa usa paleta, POS/Caja y demás
    // superficies que leen --role-* respetan el oro de la marca en vez del color
    // legacy verde/formato. Si no, usan el color legacy de la empresa.
    const paleta = usesPaletteColors(empresaActiva);
    const color = paleta ? brandColor(empresaActiva, 'acentoPrincipal') : rgbHex(empresaActiva, 0);
    const dark = paleta ? brandColor(empresaActiva, 'sombras') : rgbHex(empresaActiva, -0.18);
    root.style.setProperty('--role-primary', color);
    root.style.setProperty('--role-dark', dark);
    root.style.setProperty('--role-hover', dark);
    root.style.setProperty('--role-accent', paleta ? brandColor(empresaActiva, 'acentoPrincipal') : color);
    root.style.setProperty('--role-gradient', `linear-gradient(135deg, ${dark} 0%, ${color} 100%)`);
    root.style.setProperty('--role-nav-bg', dark);
    root.style.setProperty('--primary', color);
    root.style.setProperty('--primary-dark', dark);
    root.style.setProperty('--primary-color', color);
  }, [empleado, empresaActiva, activaId]);

  // Variables CSS de marca (§10 de la guía) — únicas para toda la app,
  // derivadas de la empresa activa (tema, color de fuente, fondo de card).
  useEffect(() => {
    if (!empresaActiva) return;
    const root = document.documentElement;
    const theme = resolveTheme(empresaActiva);
    const tokens = THEMES[theme];
    root.setAttribute('data-brand-theme', theme);
    root.style.setProperty('--brand-color', empresaColor(empresaActiva));
    root.style.setProperty('--brand-color-dark', empresaColorDark(empresaActiva));
    root.style.setProperty('--brand-page-grad', tokens.pageGradient(empresaActiva));
    root.style.setProperty('--brand-card-grad', tokens.cardGradient(empresaActiva));
    root.style.setProperty('--brand-ink', brandInk(empresaActiva));
    root.style.setProperty('--brand-border', resolveToken(tokens.border, empresaActiva));
    root.style.setProperty('--brand-border-width', tokens.borderWidth);
    root.style.setProperty('--brand-glow', tokens.glow);
    root.style.setProperty('--brand-font-title', resolveToken(tokens.titleFont, empresaActiva));
    root.style.setProperty('--brand-font-text', resolveToken(tokens.textFont, empresaActiva));
    // Roles semánticos de la paleta como CSS vars (--role-oro, etc.) para que
    // cualquier superficie pueda usarlos sin recalcular. (doc §3/§8)
    root.style.setProperty('--brand-accent', brandColor(empresaActiva, 'acentoPrincipal'));
    root.style.setProperty('--brand-role-oro', brandColor(empresaActiva, 'acentoPrincipal'));
    root.style.setProperty('--brand-role-oro-oscuro', brandColor(empresaActiva, 'sombras'));
    root.style.setProperty('--brand-role-champan', brandColor(empresaActiva, 'highlights'));
    root.style.setProperty('--brand-role-carbon', brandColor(empresaActiva, 'textoFondos'));
    root.style.setProperty('--brand-role-noir', brandColor(empresaActiva, 'fondosProfundos'));
    root.style.setProperty('--brand-role-piedra', brandColor(empresaActiva, 'textoSecundario'));
    root.style.setProperty('--brand-role-crema', brandColor(empresaActiva, 'fondoGeneral'));
  }, [empresaActiva]);

  const value = {
    empresas, empresaActiva, activaId,
    isDefaultEmpresa: activaId === DEFAULT_EMPRESA_ID,
    theme: resolveTheme(empresaActiva),
    setActiva, reload,
    requestPicker, setRequestPicker,
  };

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
};

export default EmpresaContext;
