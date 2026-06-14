// src/middlewares/security.middleware.js
// Agregar en app.js ANTES de las rutas

import rateLimit from 'express-rate-limit';

// ── 1. Headers de no-cache para rutas protegidas ──────────────────────────────
// Evita que el navegador cachee páginas de admin/tecnico.
// Soluciona: botón "atrás" después de logout y sesión persistente tras reinicio.
export function noCache(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma':        'no-cache',
    'Expires':       '0',
    'Surrogate-Control': 'no-store',
  });
  next();
}

// ── 2. Headers de seguridad HTTP (versión manual sin helmet) ──────────────────
// Si instalas helmet: reemplaza esto con helmet() en app.js
export function securityHeaders(req, res, next) {
  // Evita que la app se muestre en un iframe (clickjacking)
  res.set('X-Frame-Options', 'DENY');

  // Evita que el browser interprete el tipo MIME incorrecto
  res.set('X-Content-Type-Options', 'nosniff');

  // No enviar el referrer a sitios externos
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Fuerza HTTPS en producción
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Política de contenido básica — ajustar si usas CDNs externos
  res.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-src 'none'",
    ].join('; ')
  );

  next();
}

// ── 3. Rate limiting para login de administrador ──────────────────────────────
// Máximo 10 intentos por IP en 15 minutos
export const adminLoginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  skipSuccessfulRequests: true,          // solo cuenta intentos fallidos
  message: {
    success: false,
    message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.',
  },
  handler(req, res, next, options) {
    console.warn(`[Security] Rate limit alcanzado para login admin — IP: ${req.ip}`);
    res.status(429).render('auth/login', {
      title:       'Administrador — FumiDorado',
      error:       'Demasiados intentos fallidos. Espera 15 minutos.',
      fieldErrors: {},
      formData:    { username: '' },
    });
  },
});

// ── 4. Rate limiting para PIN de técnico ─────────────────────────────────────
// Más estricto: 5 intentos por IP en 10 minutos
export const tecnicoLoginLimiter = rateLimit({
  windowMs:         10 * 60 * 1000,
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  skipSuccessfulRequests: true,
  handler(req, res) {
    console.warn(`[Security] Rate limit alcanzado para PIN técnico — IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Demasiados intentos. Espera 10 minutos.',
    });
  },
});

// ── 5. Rate limiting general para todas las rutas ─────────────────────────────
// Protección básica contra flood de peticiones
export const generalLimiter = rateLimit({
  windowMs:        1 * 60 * 1000,   // 1 minuto
  max:             200,              // 200 req/min por IP
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => req.path.startsWith('/css') || req.path.startsWith('/js'),
});

// ── 6. Proteger archivos de uploads — requiere sesión ────────────────────────
// Los PDFs y fotos solo son accesibles para usuarios autenticados
export function protectUploads(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).send('No autorizado.');
  }
  next();
}

// ── 7. Validar que :id sea un número entero positivo ─────────────────────────
export function validateIdParam(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  req.params.id = id;   // sobreescribir con el número parseado
  next();
}

// ── 8. Validar que el entorno esté configurado correctamente ──────────────────
export function validateEnv() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'SESSION_SECRET'];
  const missing  = required.filter(k => !process.env[k]);

  if (missing.length > 0) {
    console.error('❌  Variables de entorno faltantes:', missing.join(', '));
    console.error('    Crea o revisa tu archivo .env antes de continuar.');
    process.exit(1);
  }

  if (process.env.SESSION_SECRET === 'fumiDorado_dev_secret') {
    console.warn('⚠️   SESSION_SECRET está usando el valor por defecto.');
    console.warn('    Cambia este valor en .env antes de entregar a producción.');
  }
}