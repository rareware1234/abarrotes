#!/bin/bash
set -e

export PATH="/opt/homebrew/bin:$PATH"

cd "/Users/miguel/Sistema Tienda/abarrotes-frontend"

echo ""
echo "🏪 PuntoVerde POS — Deploy a Producción"
echo "========================================="
echo ""

# 1. Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# 2. Build de producción
echo "🔨 Haciendo build de producción..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: no se generó la carpeta dist/"
    exit 1
fi

echo "✅ Build exitoso"
echo ""

# 3. Verificar Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "📥 Instalando Firebase CLI..."
    npm install -g firebase-tools
fi

# 4. Verificar autenticación
echo "🔑 Verificando autenticación de Firebase..."
firebase projects:list > /dev/null 2>&1 || {
    echo "⚠️  No estás autenticado. Ejecuta: firebase login"
    exit 1
}

# 5. Deploy
echo "🚀 Desplegando a Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deploy completado"
echo "🌐 https://abarrotes-digitales.web.app"
echo ""
