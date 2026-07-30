# Ship — runbook de despliegue (web)

Meta: dejar `punto-verde-web` en producción para usuarios reales, sin atorarnos.
`deploy.sh` es **`--only hosting`** → publicar el web **NO** toca reglas ni
Functions. Eso ya está desacoplado; shippear el front es de bajo riesgo.

## Ruta crítica (ordenada)

### 1. Verificar dependencias vivas (tuyo — 2 min, consola/CLI)
El login del web depende de que estén **desplegadas** estas piezas de servidor:
- [ ] Cloud Function **`lookupEmpleadoEmail`** (el login la llama; sin ella, no
      hay login). Verificar en consola → Functions, o `firebase functions:list`.
- [ ] Reglas Firestore **endurecidas** vivas (el login lee el propio doc tras
      autenticar). Si prod aún tuviera reglas permisivas, el web igual funciona,
      pero conviene la endurecida (ver §3).

Si ambas están vivas → el web es publicable ya (paso 2).

### 2. Publicar el front (yo puedo dejarlo listo; el deploy final lo corres tú)
```bash
cd punto-verde-web
npm run build          # ✅ verificado que compila
./deploy.sh            # build + firebase deploy --only hosting
```
Es reversible: Firebase Hosting guarda versiones (rollback en 1 clic).

### 3. Reglas (OPCIONAL para el front; SÍ para cerrar seguridad)
La `firestore.rules` de este repo ya está reconciliada a la endurecida canónica
(idéntica al repo Swift). NO se despliega con `deploy.sh`. Para desplegarla:
```bash
firebase deploy --only firestore:rules
```
⚠️ Antes: validar (login, POS, productos, caja, crédito) contra la regla, idealmente
en el **emulador** o en un proyecto de staging. Si quieres, puedo montar un set
mínimo de tests de reglas (requiere instalar `@firebase/rules-unit-testing` + Java
para el emulador) — dime y lo preparo; NO es bloqueador del hosting.

## Smoke test post-deploy (2 min, en el sitio publicado)
- [ ] Login con un número de empleado real → entra.
- [ ] "¿Olvidaste tu contraseña?" → llega el correo.
- [ ] POS: abrir caja, agregar producto, cobrar → venta registrada.
- [ ] Cambiar de empresa (si aplica) → solo ves datos de esa empresa.
- [ ] Logout → limpia sesión.

## Rollback
- Hosting: consola → Hosting → versión anterior → "Rollback".
- Reglas: re-desplegar la versión previa (tenla en git antes de tocar).

## Qué es tuyo vs mío (para no atorarnos)
| Acción | Quién |
|---|---|
| Build, arreglos de front, docs, tests locales | yo (seguro) |
| Verificar Functions/reglas vivas, `firebase deploy`, consola | tú |
