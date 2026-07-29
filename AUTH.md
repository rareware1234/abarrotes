# Autenticación — contrato único React ↔ macOS

Modelo de autenticación compartido entre la app **web (React)** y **macOS (Swift)**.
Ambas plataformas implementan el MISMO contrato; las diferencias son solo de
persistencia nativa.

## Identidad
- El usuario inicia sesión con su **número de empleado** (`numEmpleado`), NO con
  email. El email es un detalle interno que el usuario nunca escribe.

## Flujo de login (idéntico en ambas plataformas)
1. `numEmpleado` → Cloud Function **`lookupEmpleadoEmail`** → devuelve **solo el
   email** (sin PII; no abre la colección `empleados`, bloqueada por reglas).
2. `signInWithEmailAndPassword(email, password)` (Firebase Auth).
3. Autenticado → leer el **propio** doc de `empleados` (permitido por reglas) →
   derivar `rol`, `empresaId`, `tiendas`, permisos.
4. Construir el objeto de sesión y persistir (ver Persistencia).

> El login NO lee `empleados` directamente antes de autenticar (las reglas lo
> impiden a propósito). Web: `AuthContext.signIn`. Swift: `AuthStore.signIn` /
> `AuthStore.resolverEmail`.

## Operaciones (contrato)
| Operación | Firma | Retorno |
|---|---|---|
| Login | `signIn(numEmpleado, password)` | `{ success: bool, error?: string }` |
| Logout | `signOut()` | limpia sesión + estado |
| Recuperar contraseña | `resetPassword(numEmpleado)` | `{ success: bool, error?: string }` (lookup + `sendPasswordResetEmail`) |
| Estado de sesión | `{ empleado, isAuthenticated, isLoading }` | reactivo |

## Errores unificados (código → mensaje al usuario)
| Código | Mensaje |
|---|---|
| `auth/invalid-credential`, `auth/wrong-password` | "Número de empleado o contraseña incorrectos" |
| `auth/user-disabled` / cuenta inactiva | "Tu cuenta está desactivada" |
| `permission-denied` | "Error de configuración del servidor. Contacta al administrador." |
| `functions/not-found` (lookup) | "Empleado no encontrado" |

Nunca se registra el objeto de error completo (puede traer email/PII): solo
`error.code`.

## Persistencia de sesión
- **Web:** token de Firebase (IndexedDB, gestionado por el SDK) + objeto de
  empleado en `sessionStorage` (`desktop_empleado`) — se limpia al cerrar la
  pestaña y en `signOut`. NO se usa `localStorage` para datos de sesión (solo
  el `numEmpleado` recordado, no sensible).
- **macOS:** token de Firebase + credenciales "recordarme" en **Keychain**
  (`kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, sin iCloud/backup).

## Mapeo de implementación
| Concepto | React | Swift |
|---|---|---|
| Estado/provider | `context/AuthContext.jsx` | `Core/Stores/AuthStore.swift` |
| Login | `signIn` | `signIn` |
| Recuperar contraseña | `resetPassword` | (pendiente en Swift: espejo de `resetPassword`) |
| Lookup email | CF `lookupEmpleadoEmail` | CF `lookupEmpleadoEmail` |

## Pendiente de paridad
- Swift: añadir `resetPassword` (espejo del web) para paridad total del contrato.
- Activación de cuentas nuevas: migrar a Cloud Function server-side (ver
  `docs/SECURITY.md` R2), no auto-registro en cliente.
