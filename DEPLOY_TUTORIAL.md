# Tutorial: Despliegue a Producción - Abarrotes Digitales

## URL de Producción
**https://abarrotes-digitales.web.app**

---

## Proceso Completo de Despliegue

### 1. Build del Proyecto

```bash
# Ir al directorio del frontend
cd "/Users/miguel/Sistema Tienda/abarrotes-frontend"

# Configurar PATH si es necesario (Mac con Homebrew)
export PATH="/opt/homebrew/bin:$PATH"

# Instalar dependencias (solo si hay cambios en package.json)
npm install

# Hacer build de producción
npm run build
```

**Salida esperada:**
```
dist/index.html
dist/assets/logo-*.png
dist/assets/index-*.css
dist/assets/index-*.js

✓ built in ~400ms
```

### 2. Desplegar a Firebase

```bash
# Asegurar que Firebase CLI esté instalado
npm install -g firebase-tools

# Desplegar solo hosting (no functions, no firestore)
firebase deploy --only hosting
```

**Salida esperada:**
```
=== Deploying to 'abarrotes-digitales'...
i  deploying hosting
i  hosting[abarrotes-digitales]: beginning deploy...
i  hosting[abarrotes-digitales]: found 8 files in dist
i  hosting: upload complete
✔  hosting[abarrotes-digitales]: file upload complete
i  hosting[abarrotes-digitales]: finalizing version...
✔  hosting[abarrotes-digitales]: version finalized
i  hosting[abarrotes-digitales]: releasing new version...
✔  hosting[abarrotes-digitales]: release complete

✔  Deploy complete!
Hosting URL: https://abarrotes-digitales.web.app
```

---

## Comandos Útiles

### Verificar estado de Firebase
```bash
firebase projects:list
```

### Ver configuración del proyecto
```bash
cat .firebaserc
cat firebase.json
```

### Desplegar con modo interactivo
```bash
firebase deploy
```

### Desplegar múltiples servicios
```bash
firebase deploy --only hosting,functions
```

---

## Solución de Problemas

### Error: "firebase: command not found"
```bash
export PATH="/opt/homebrew/bin:$PATH"
```

### Error: "node: No such file or directory"
```bash
# Verificar instalación de Node
/opt/homebrew/bin/node --version

# Si no está, reinstalar Node
brew install node
```

### Error: "Not authenticated"
```bash
# Login en Firebase
firebase login

# O usar cuenta específica
firebase login:add user@gmail.com
firebase login:use user@gmail.com
```

### Error: Permisos insuficientes
- Verificar que tienes acceso al proyecto `abarrotes-digitales` en Firebase Console
- Solicitar acceso al propietario del proyecto

### Build falla por dependencias
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Estructura de Archivos Firebase

```
abarrotes-frontend/
├── .firebaserc          # Configuración del proyecto Firebase
├── firebase.json        # Configuración de despliegue
├── dist/                # Archivos compilados (NO editar manualmente)
│   ├── index.html
│   └── assets/
└── src/                 # Código fuente (editar aquí)
```

---

## Notas Importantes

1. **El build SIEMPRE se hace localmente** - Firebase solo sirve los archivos del `dist/`
2. **El dist/ se genera automáticamente** con `npm run build`
3. **No editar archivos en dist/** - Cualquier cambio manual se pierde en el siguiente build
4. **El despliegue toma ~30 segundos** - Los cambios están disponibles inmediatamente después

---

## Workflow Completo para Hacer Cambios

1. Editar archivos en `src/`
2. Probar en dev: `npm run dev` → http://localhost:5173
3. Hacer build: `npm run build`
4. Desplegar: `firebase deploy --only hosting`
5. Verificar en: https://abarrotes-digitales.web.app

---

## Scripts Automatizados (Opcional)

Crear `deploy.sh`:
```bash
#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"

cd "/Users/miguel/Sistema Tienda/abarrotes-frontend"

echo "📦 Haciendo build..."
npm run build

echo "🚀 Desplegando a Firebase..."
firebase deploy --only hosting

echo "✅ Listo! https://abarrotes-digitales.web.app"
```

Uso:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Recursos

- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Console del Proyecto](https://console.firebase.google.com/project/abarrotes-digitales/overview)
