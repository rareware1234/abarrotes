# Seguridad — web (punto-verde-web)

Estado de seguridad del cliente web y **handoff** de lo que falta (servidor/
consola), que NO puede hacerse desde este repo sin acceso a Firebase y sin
poder probar contra producción. Auditoría base compartida: ver
`../Punto.Verde-swift/Punto.Verde/docs/SECURITY.md`.

## ✅ Cliente web — hecho / verificado
- **XSS:** sin `dangerouslySetInnerHTML`, `innerHTML` ni `eval` en `src/`.
  React auto-escapa → riesgo de inyección mitigado.
- **Guards de ruta centralizados:** `components/ProtectedRoute` expone
  `ProtectedRoute` / `RoleProtectedRoute` (con `requiredPermission`) /
  `PublicRoute`; todas las rutas de `App.jsx` pasan por ellos.
- **Login sin exposición de PII:** el login usa la Cloud Function
  `lookupEmpleadoEmail` (solo email); NO lee `empleados` sin sesión.
- **Sesión:** en `sessionStorage` (se limpia al cerrar pestaña), no
  `localStorage`. El token de Firebase lo gestiona el SDK.
- **Logging sin PII:** `signIn`/`resetPassword` registran solo `error.code`.
- **Recuperación de contraseña:** `AuthContext.resetPassword` (lookup seguro +
  `sendPasswordResetEmail`).

## ✅ Reglas Firestore — reconciliadas (este repo)
`firestore.rules` era **permisiva** (`empleados: read if true` → PII pública,
sin aislamiento por empresa). Se reemplazó por la versión **endurecida
canónica** (idéntica a la del repo Swift): `empleados` cerrado, aislamiento por
`empresaId` (`mismaEmpresa`), `esAdmin`, deny-all por defecto, scaffolding de
App Check. Validadores de forma quedaron como propuesta comentada al final.

> `deploy.sh` es `--only hosting` → NO despliega reglas. Antes de desplegar
> reglas: `firebase deploy --only firestore:rules` **tras probar en emulador/
> staging** (login, POS, productos, caja, crédito).

## 🔴 Handoff — MANUAL / servidor (requiere consola Firebase; NO desde este repo)
Estos pasos afectan producción y necesitan pruebas; no se ejecutan a ciegas:
1. **Cloud Functions:** desplegar (`functions/`, en el repo Swift) y configurar
   el secret `MERCADOPAGO_ACCESS_TOKEN` + params. (R4: sacar el token MP del
   cliente.)
2. **Reglas:** `firebase deploy --only firestore:rules` tras validar en emulador.
3. **App Check enforcement:** registrar App Attest/DeviceCheck + debug token en
   la consola; pasar de "unenforced" a "enforced"; recién entonces activar
   `appCheck() = request.app != null` en `firestore.rules` (hoy `= true`).
4. **R2 — contraseña temporal:** crear cuentas vía Cloud Function con Admin SDK
   (sin `passwordTemp` en Firestore).
5. **Storage rules:** endurecer análogo a Firestore (por empresa + auth + App
   Check).

Severidades y detalle completo: `../Punto.Verde-swift/Punto.Verde/docs/SECURITY.md`.
