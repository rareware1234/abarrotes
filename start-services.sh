#!/bin/bash

echo "Iniciando servicios de Abarrotes Digitales..."
echo "=============================================="

# Verificar si los directorios existen
if [ ! -d "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/backend-auth" ]; then
    echo "❌ Error: Directorio backend-auth no encontrado"
    exit 1
fi

if [ ! -d "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/employee-app" ]; then
    echo "❌ Error: Directorio employee-app no encontrado"
    exit 1
fi

if [ ! -d "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/abarrotes-frontend" ]; then
    echo "❌ Error: Directorio abarrotes-frontend no encontrado"
    exit 1
fi

# Iniciar backend de autenticación
echo ""
echo "🚀 Iniciando backend de autenticación..."
cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/backend-auth"
npm start &
BACKEND_PID=$!
echo "✅ Backend corriendo en http://localhost:3001 (PID: $BACKEND_PID)"

# Esperar a que el backend esté listo
sleep 3

# Iniciar versión móvil
echo ""
echo "📱 Iniciando versión móvil..."
cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/employee-app"
npm run dev &
MOBILE_PID=$!
echo "✅ Versión móvil corriendo en http://localhost:5174 (PID: $MOBILE_PID)"

# Iniciar versión de escritorio
echo ""
echo "🖥️  Iniciando versión de escritorio..."
cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/abarrotes-frontend"
npm run dev -- --port 5173 &
DESKTOP_PID=$!
echo "✅ Versión de escritorio corriendo en http://localhost:5173 (PID: $DESKTOP_PID)"

# Esperar a que los servidores estén listos
sleep 5

# Verificar servicios
echo ""
echo "=============================================="
echo "🔍 Verificando servicios..."
echo "=============================================="

# Backend
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend de autenticación: http://localhost:3001"
else
    echo "❌ Backend de autenticación: No disponible"
fi

# Versión móvil
if curl -s http://localhost:5174 > /dev/null; then
    echo "✅ Versión móvil: http://localhost:5174"
else
    echo "❌ Versión móvil: No disponible"
fi

# Versión de escritorio
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Versión de escritorio: http://localhost:5173"
else
    echo "❌ Versión de escritorio: No disponible"
fi

echo ""
echo "=============================================="
echo "Sistema listo para usar"
echo "=============================================="
echo ""
echo "Credenciales de prueba:"
echo "  - Staff: EMP001 / 1234"
echo "  - Supervisor: EMP003 / 1234"
echo "  - Director: EMP005 / 1234"
echo "  - Admin: ADMIN001 / admin123"
echo ""
echo "Para detener los servicios, ejecuta:"
echo "  kill $BACKEND_PID $MOBILE_PID $DESKTOP_PID"
echo ""
