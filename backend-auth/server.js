require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Conexión a base de datos SQLite
const dbPath = path.join(__dirname, 'abarrotes.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
    initializeDatabase();
  }
});

// Inicializar base de datos
function initializeDatabase() {
  db.serialize(() => {
    // Tabla de usuarios/empleados
    db.run(`CREATE TABLE IF NOT EXISTS empleados (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      profile TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de cajas
    db.run(`CREATE TABLE IF NOT EXISTS cajas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id TEXT,
      monto_apertura REAL,
      monto_cierre REAL,
      fecha_apertura DATETIME,
      fecha_cierre DATETIME,
      estado TEXT DEFAULT 'abierta',
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )`);

    // Tabla de ventas
    db.run(`CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE,
      empleado_id TEXT,
      total REAL,
      metodo_pago TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    )`);

    // Tabla de items de venta
    db.run(`CREATE TABLE IF NOT EXISTS venta_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto_nombre TEXT,
      cantidad INTEGER,
      precio REAL,
      subtotal REAL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id)
    )`);

    // Tabla de tareas
    db.run(`CREATE TABLE IF NOT EXISTS tareas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      prioridad TEXT DEFAULT 'media',
      estado TEXT DEFAULT 'pendiente',
      assigned_by TEXT,
      assigned_to TEXT,
      fecha_limite DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_by) REFERENCES empleados(id),
      FOREIGN KEY (assigned_to) REFERENCES empleados(id)
    )`);

    // Insertar usuarios de prueba si no existen
    const empleados = [
      { id: 'EMP001', nombre: 'Juan García', profile: 'staff', password: '1234' },
      { id: 'EMP002', nombre: 'María López', profile: 'staff', password: '1234' },
      { id: 'EMP003', nombre: 'Carlos Rodríguez', profile: 'supervisor', password: '1234' },
      { id: 'EMP004', nombre: 'Ana Martínez', profile: 'supervisor', password: '1234' },
      { id: 'EMP005', nombre: 'Pedro Sánchez', profile: 'director', password: '1234' },
      { id: 'EMP006', nombre: 'Laura Fernández', profile: 'director', password: '1234' },
      { id: 'ADMIN001', nombre: 'Juan Perez', profile: 'director', password: 'admin123' }
    ];

    empleados.forEach(emp => {
      bcrypt.hash(emp.password, 10, (err, hash) => {
        if (err) {
          console.error('Error al encriptar contraseña:', err);
          return;
        }

        db.run(
          `INSERT OR IGNORE INTO empleados (id, nombre, profile, password_hash) VALUES (?, ?, ?, ?)`,
          [emp.id, emp.nombre, emp.profile, hash],
          (err) => {
            if (err) {
              console.error(`Error insertando empleado ${emp.id}:`, err.message);
            } else {
              console.log(`Empleado ${emp.id} (${emp.nombre}) creado/verificado`);
            }
          }
        );
      });
    });
  });
}

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// ==================== ENDPOINTS ====================

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { numeroEmpleado, password } = req.body;

    if (!numeroEmpleado || !password) {
      return res.status(400).json({ error: 'Número de empleado y contraseña requeridos' });
    }

    // Buscar empleado en la base de datos
    db.get(
      'SELECT * FROM empleados WHERE id = ? AND activo = 1',
      [numeroEmpleado],
      async (err, empleado) => {
        if (err) {
          console.error('Error en consulta de login:', err);
          return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (!empleado) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, empleado.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const tokenPayload = {
          id: empleado.id,
          nombre: empleado.nombre,
          profile: empleado.profile
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

        res.json({
          success: true,
          token,
          user: {
            id: empleado.id,
            nombre: empleado.nombre,
            profile: empleado.profile
          }
        });
      }
    );
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Verificar token (para mantener sesión activa)
app.get('/api/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Obtener perfil del empleado actual
app.get('/api/empleado/perfil', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, nombre, profile, created_at FROM empleados WHERE id = ?',
    [req.user.id],
    (err, empleado) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener perfil' });
      }
      if (!empleado) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
      }
      res.json(empleado);
    }
  );
});

// Obtener lista de empleados (para asignar tareas)
app.get('/api/empleados', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, nombre, profile FROM empleados WHERE activo = 1 AND id != ?',
    [req.user.id],
    (err, empleados) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener empleados' });
      }
      res.json(empleados);
    }
  );
});

// CRUD de Tareas
app.get('/api/tareas', authenticateToken, (req, res) => {
  const query = `
    SELECT t.*, 
           a.nombre as assigned_by_name,
           b.nombre as assigned_to_name
    FROM tareas t
    LEFT JOIN empleados a ON t.assigned_by = a.id
    LEFT JOIN empleados b ON t.assigned_to = b.id
    WHERE t.assigned_to = ? OR t.assigned_by = ?
    ORDER BY t.created_at DESC
  `;
  
  db.all(query, [req.user.id, req.user.id], (err, tareas) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener tareas' });
    }
    res.json(tareas);
  });
});

app.post('/api/tareas', authenticateToken, (req, res) => {
  const { titulo, prioridad, fecha_limite, assigned_to } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: 'El título es requerido' });
  }

  const query = `
    INSERT INTO tareas (titulo, prioridad, fecha_limite, assigned_by, assigned_to, estado)
    VALUES (?, ?, ?, ?, ?, 'pendiente')
  `;

  db.run(
    query,
    [titulo, prioridad, fecha_limite, req.user.id, assigned_to || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al crear tarea' });
      }
      
      // Devolver la tarea creada
      db.get('SELECT * FROM tareas WHERE id = ?', [this.lastID], (err, tarea) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener tarea creada' });
        }
        res.json(tarea);
      });
    }
  );
});

app.put('/api/tareas/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  db.run(
    'UPDATE tareas SET estado = ? WHERE id = ? AND (assigned_by = ? OR assigned_to = ?)',
    [estado, id, req.user.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al actualizar tarea' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
      }
      res.json({ success: true });
    }
  );
});

// Ventas (para sincronización)
app.get('/api/ventas/hoy', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  db.all(
    `SELECT v.*, e.nombre as empleado_nombre 
     FROM ventas v
     JOIN empleados e ON v.empleado_id = e.id
     WHERE DATE(v.fecha) = DATE(?)
     ORDER BY v.fecha DESC`,
    [today],
    (err, ventas) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener ventas' });
      }
      res.json(ventas);
    }
  );
});

// Caja
app.get('/api/caja/abierta/:empleadoId', authenticateToken, (req, res) => {
  db.get(
    `SELECT * FROM cajas 
     WHERE empleado_id = ? AND estado = 'abierta'
     ORDER BY fecha_apertura DESC LIMIT 1`,
    [req.params.empleadoId],
    (err, caja) => {
      if (err) {
        return res.status(500).json({ error: 'Error al verificar caja' });
      }
      res.json(caja || null);
    }
  );
});

app.post('/api/caja/abrir', authenticateToken, (req, res) => {
  const { montoApertura } = req.body;

  if (!montoApertura || montoApertura <= 0) {
    return res.status(400).json({ error: 'Monto de apertura requerido' });
  }

  db.run(
    `INSERT INTO cajas (empleado_id, monto_apertura, fecha_apertura, estado)
     VALUES (?, ?, datetime('now'), 'abierta')`,
    [req.user.id, montoApertura],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error al abrir caja' });
      }
      
      db.get('SELECT * FROM cajas WHERE id = ?', [this.lastID], (err, caja) => {
        if (err) {
          return res.status(500).json({ error: 'Error al obtener caja' });
        }
        res.json(caja);
      });
    }
  );
});

app.post('/api/caja/cerrar/:id', authenticateToken, (req, res) => {
  const { montoCierre } = req.query;

  if (!montoCierre || montoCierre <= 0) {
    return res.status(400).json({ error: 'Monto de cierre requerido' });
  }

  // Obtener monto de apertura y ventas del día
  db.get(
    `SELECT c.monto_apertura, 
            COALESCE(SUM(v.total), 0) as total_ventas
     FROM cajas c
     LEFT JOIN ventas v ON v.empleado_id = c.empleado_id AND DATE(v.fecha) = DATE(c.fecha_apertura)
     WHERE c.id = ? AND c.empleado_id = ?`,
    [req.params.id, req.user.id],
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Error al calcular cierre' });
      }

      const totalEsperado = data.monto_apertura + data.total_ventas;
      const diferencia = parseFloat(montoCierre) - totalEsperado;

      db.run(
        `UPDATE cajas 
         SET monto_cierre = ?, fecha_cierre = datetime('now'), estado = 'cerrada'
         WHERE id = ? AND empleado_id = ?`,
        [montoCierre, req.params.id, req.user.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error al cerrar caja' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Caja no encontrada' });
          }
          res.json({ 
            success: true, 
            diferencia: Math.abs(diferencia) < 0.01 ? 0 : diferencia 
          });
        }
      );
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de autenticación corriendo en http://localhost:${PORT}`);
  console.log(`Servidor disponible en todas las interfaces en puerto ${PORT}`);
  console.log(`Endpoints disponibles:`);
  console.log(`  - POST /api/login`);
  console.log(`  - GET  /api/verify`);
  console.log(`  - GET  /api/empleado/perfil`);
  console.log(`  - GET  /api/empleados`);
  console.log(`  - GET  /api/tareas`);
  console.log(`  - POST /api/tareas`);
  console.log(`  - PUT  /api/tareas/:id`);
  console.log(`  - GET  /api/ventas/hoy`);
  console.log(`  - GET  /api/caja/abierta/:empleadoId`);
  console.log(`  - POST /api/caja/abrir`);
  console.log(`  - POST /api/caja/cerrar/:id`);
});
