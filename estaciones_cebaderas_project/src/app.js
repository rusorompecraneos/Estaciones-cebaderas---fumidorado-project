// app.js
import 'dotenv/config';
import express        from 'express';
import session        from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pool           from './config/db.config.js';
import authRoutes     from './routes/auth.routes.js';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── __dirname en ES Modules ───────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Motor de plantillas ───────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', join(__dirname, '..', 'views'));
// ── Archivos estáticos ────────────────────────────────────────────────────────
app.use(express.static(join(__dirname,'..', 'public')));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sesiones con PostgreSQL ───────────────────────────────────────────────────
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,   // crea la tabla si no existe
  }),
  secret:            process.env.SESSION_SECRET || 'fumiDorado_dev_secret',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   1000 * 60 * 60 * 8,  // 8 horas
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  name: 'fd.sid',
}));

// ── Inyectar currentUser en todas las vistas ──────────────────────────────────
app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
});

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

// Raíz → selector de rol
app.get('/', (req, res) => res.redirect('/auth/role-select'));

// ── Placeholders de dashboards (implementar en próximas iteraciones) ──────────
app.get('/admin/dashboard', (req, res) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.redirect('/auth/login');
  }
  res.send(`<h1>Dashboard Admin</h1><p>Bienvenido, ${req.session.user.nombre}</p><a href="/auth/logout">Cerrar sesión</a>`);
});

app.get('/tecnico/dashboard', (req, res) => {
  if (!req.session?.user || req.session.user.role !== 'tecnico') {
    return res.redirect('/auth/tecnico');
  }
  res.send(`<h1>Dashboard Técnico</h1><p>Bienvenido, ${req.session.user.nombre}</p><a href="/auth/logout">Cerrar sesión</a>`);
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send('<h1>404 — Página no encontrada</h1><a href="/">Volver al inicio</a>');
});

// ── Error handler global ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[app] Error no controlado:', err);
  res.status(500).send('<h1>Error interno del servidor</h1>');
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Servidor corriendo en http://localhost:${PORT}`);
});

export default app;