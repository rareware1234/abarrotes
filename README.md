# Sistema de Abarrotes Digitales

Sistema completo de punto de venta y gestión de empleados para Abarrotes Digitales.

## Arquitectura

El sistema consta de tres componentes principales:

1. **Backend de Autenticación** (Node.js + Express + SQLite)
   - Puerto: 3001
   - URL: http://localhost:3001

2. **Aplicación Móvil** (React + Vite)
   - Puerto: 5174
   - URL: http://localhost:5174

3. **Aplicación de Escritorio** (React + Vite)
   - Puerto: 5173
   - URL: http://localhost:5173

## Instrucciones de Uso

### Método 1: Script automático (Recomendado)

Ejecuta el script de inicio:

```bash
cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales"
./start-services.sh
```

### Método 2: Inicio manual

1. **Iniciar backend de autenticación:**
   ```bash
   cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/backend-auth"
   npm start
   ```

2. **Iniciar versión móvil:**
   ```bash
   cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/employee-app"
   npm run dev
   ```

3. **Iniciar versión de escritorio:**
   ```bash
   cd "/Users/ahernandez/Library/Mobile Documents/com~apple~CloudDocs/Abarrotes digitales/abarrotes-frontend"
   npm run dev -- --port 5173
   ```

## Credenciales de Prueba

| Usuario | Contraseña | Perfil | Color |
|---------|------------|--------|-------|
| EMP001 | 1234 | Staff | Verde |
| EMP002 | 1234 | Staff | Verde |
| EMP003 | 1234 | Supervisor | Azul |
| EMP004 | 1234 | Supervisor | Azul |
| EMP005 | 1234 | Director | Naranja |
| EMP006 | 1234 | Director | Naranja |
| ADMIN001 | admin123 | Director | Naranja |

## Características del Sistema

### Perfiles y Permisos

- **Staff (Verde)**
  - Acceso a POS, Scanner, Perfil, Asistencia, Tareas, Caja
  - Puede gestionar su caja
  - Recibe tareas

- **Supervisor (Azul)**
  - Acceso a POS, Scanner, Perfil, Asistencia, Tareas, Caja, Dashboard
  - Puede asignar tareas a otros empleados
  - Puede gestionar su caja

- **Director (Naranja)**
  - Acceso completo a todas las funcionalidades
  - Puede asignar tareas a cualquier empleado
  - Puede ver reportes y dashboard

### Funcionalidades

1. **Autenticación JWT**
   - Tokens seguros con expiración de 8 horas
   - Validación en cada solicitud
   - Protección contra CSRF

2. **Sincronización de Pedidos**
   - Los pedidos se guardan en `localStorage`
   - Compartido entre móvil y escritorio
   - Incluye ID del empleado para rastreo

3. **Gestión de Caja**
   - Apertura y cierre de caja
   - Registro de transacciones
   - Cálculo de diferencias

4. **Sistema de Tareas**
   - Asignación de tareas entre empleados
   - Seguimiento de estado (pendiente/completada)
   - Prioridades (alta/media/baja)

## Estructura de Archivos

```
Abarrotes digitales/
├── backend-auth/           # Servidor de autenticación
│   ├── server.js          # API principal
│   ├── abarrotes.db       # Base de datos SQLite
│   └── package.json
├── employee-app/          # Aplicación móvil
│   ├── src/
│   │   ├── pages/         # Páginas de la app
│   │   ├── services/      # Servicios API
│   │   └── data/          # Datos de perfiles
│   └── package.json
├── abarrotes-frontend/    # Aplicación de escritorio
│   ├── src/
│   │   ├── pages/         # Páginas de la app
│   │   ├── hooks/         # Hooks personalizados
│   │   └── data/          # Datos de perfiles
│   └── package.json
└── start-services.sh      # Script de inicio
```

## API Endpoints

### Autenticación
- `POST /api/login` - Iniciar sesión
- `GET /api/verify` - Verificar token

### Empleados
- `GET /api/empleado/perfil` - Perfil del empleado actual
- `GET /api/empleados` - Lista de empleados

### Tareas
- `GET /api/tareas` - Obtener tareas
- `POST /api/tareas` - Crear tarea
- `PUT /api/tareas/:id` - Actualizar tarea

### Caja
- `GET /api/caja/abierta/:empleadoId` - Verificar caja abierta
- `POST /api/caja/abrir` - Abrir caja
- `POST /api/caja/cerrar/:id` - Cerrar caja

## Seguridad

1. **JWT Tokens** - Autenticación basada en tokens
2. **Bcrypt** - Hash seguro de contraseñas
3. **CORS** - Control de origen de solicitudes
4. **Validación** - Sanitización de entradas
5. **Protección de rutas** - Middleware de autenticación

## Base de Datos

La base de datos SQLite (`abarrotes.db`) contiene las siguientes tablas:
- `empleados` - Información de empleados
- `cajas` - Registro de cajas
- `ventas` - Registro de ventas
- `venta_items` - Items de cada venta
- `tareas` - Tareas asignadas

## Notas Importantes

1. **Para producción**: Cambiar `JWT_SECRET` en el archivo `.env`
2. **Puertos**: Asegurarse de que los puertos 3001, 5173 y 5174 estén disponibles
3. **Datos de prueba**: Los empleados se crean automáticamente al iniciar el backend
4. **Sincronización**: Los pedidos se almacenan en `localStorage` del navegador

## Solución de Problemas

### El servidor no inicia
- Verifica que los puertos no estén en uso: `lsof -i :3001`
- Revisa los logs de error en la terminal

### No puedo conectar a la API
- Verifica que el backend esté corriendo: `curl http://localhost:3001/api/health`
- Revisa la configuración de CORS

### Los colores no se aplican
- Asegúrate de haber iniciado sesión correctamente
- Verifica el `localStorage` del navegador

## Soporte

Para problemas técnicos, revisa los logs en la terminal o la consola del navegador.
