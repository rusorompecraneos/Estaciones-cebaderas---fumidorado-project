// app.js  (src/app.js en tu proyecto)
import 'dotenv/config';
import express          from 'express';
import session          from 'express-session';
import connectPgSimple  from 'connect-pg-simple';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs               from 'fs';

import pool           from './config/db.config.js';
import authRoutes     from './routes/auth.routes.js';
import passwordRoutes from './routes/password.routes.js';
import adminRoutes    from './routes/admin.routes.js';
import tecnicoRoutes  from './routes/tecnico.routes.js';

import {
  validateEnv,
  securityHeaders,
  generalLimiter,
  noCache,
  protectUploads,
} from './middlewares/security.middleware.js';

const app  = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Validar entorno al arrancar ───────────────────────────────────────────────
// Si faltan variables críticas, el servidor no arranca.
validateEnv();

// ── Crear carpetas de uploads ─────────────────────────────────────────────────
const uploadsDir   = join(__dirname, '..', 'public', 'uploads', 'estaciones');
const diagramasDir = join(__dirname, '..', 'public', 'uploads', 'diagramas');
if (!fs.existsSync(uploadsDir))   fs.mkdirSync(uploadsDir,   { recursive: true });
if (!fs.existsSync(diagramasDir)) fs.mkdirSync(diagramasDir, { recursive: true });

// ── Motor de plantillas ───────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', join(__dirname, '..', 'views'));

// ── Deshabilitar header que revela que usamos Express ────────────────────────
app.disable('x-powered-by');

// ── Headers de seguridad HTTP (aplicar a todas las rutas) ────────────────────
app.use(securityHeaders);

// ── Rate limiting general ─────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Archivos estáticos públicos (CSS, JS, imágenes del sistema) ───────────────
// IMPORTANTE: los /uploads requieren sesión — se declaran DESPUÉS con protectUploads
app.use('/css',    express.static(join(__dirname, '..', 'public', 'css')));
app.use('/js',     express.static(join(__dirname, '..', 'public', 'js')));
app.use('/images', express.static(join(__dirname, '..', 'public', 'images')));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));   // limitar tamaño del body JSON

// ── Sesiones con PostgreSQL ───────────────────────────────────────────────────
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool,
    tableName:            'session',
    createTableIfMissing: true,
    // Limpiar sesiones expiradas automáticamente cada hora
    pruneSessionInterval: 60 * 60,
  }),
  secret:            process.env.SESSION_SECRET,   // ya validado arriba — nunca undefined
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   1000 * 60 * 60 * 8,   // 8 horas
    httpOnly: true,                  // no accesible desde JS del cliente
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  name: 'fd.sid',
}));

// ── currentUser disponible en todas las vistas ────────────────────────────────
app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
});

// ── Proteger archivos de uploads — requiere sesión activa ─────────────────────
// Los PDFs de diagramas y fotos de estaciones solo son para usuarios logueados
app.use('/uploads', protectUploads, express.static(join(__dirname, '..', 'public', 'uploads')));

// ── Aplicar no-cache a todas las rutas de admin y técnico ────────────────────
// Esto soluciona el bug del botón "atrás" y la sesión persistente tras reinicio
app.use('/admin',   noCache);
app.use('/tecnico', noCache);

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth',     authRoutes);
app.use('/password', passwordRoutes);
app.use('/admin',    adminRoutes);
app.use('/tecnico',  tecnicoRoutes);

// Raíz → selector de rol
app.get('/', (req, res) => res.redirect('/auth/role-select'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('<h1>404 — Página no encontrada</h1><a href="/">Volver al inicio</a>');
});

// ── Error handler global ──────────────────────────────────────────────────────
// En producción NO revelar el stack trace
app.use((err, req, res, next) => {
  console.error('[app] Error no controlado:', err);

  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).send(
    isDev
      ? `<h1>Error interno</h1><pre>${err.stack}</pre>`
      : '<h1>Error interno del servidor</h1><p>Contacta al administrador.</p>'
  );
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
  console.log(`    Entorno: ${process.env.NODE_ENV || 'development'}`);
});

export default app;