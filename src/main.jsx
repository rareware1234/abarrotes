import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './responsive.css'
import './styles/pos-layout.css'
import App from './App.jsx'
import './styles/page-shell.css'
import './styles/pos-redesign.css'
import './styles/inicio.css'
import './styles/pv-polish.css'
import { applyDesignTokens } from './lib/tokens.js'

// Puente tokens.js → variables CSS `:root`. Se ejecuta ANTES del render para
// que todo el CSS (`var(--pv-*)`) tenga los valores del design system desde el
// primer paint. Fuente única = src/lib/tokens.js (alineado 1:1 con el Swift).
applyDesignTokens()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)