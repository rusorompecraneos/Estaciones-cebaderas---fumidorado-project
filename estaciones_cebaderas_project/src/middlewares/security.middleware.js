// src/middlewares/security.middleware.js
// Agregar en app.js ANTES de las rutas

import rateLimit from 'express-rate-limit';

// ── 1. Headers de no-cache para rutas protegidas ──────────────────────────────
export function noCache(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma':        'no-cache',
    'Expires':       '0',
    'Surrogate-Control': 'no-store',
  });
  next();
}

// ── 2. Headers de seguridad HTTP ──────────────────────────────────────────────
export function securityHeaders(req, res, next) {
  res.set('X-Frame-Options', 'DENY');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

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
      // PDF.js crea un Web Worker desde una blob: URL para procesar PDFs
      // en un hilo separado. Sin esto, cae a "fake worker" y falla en
      // la primera renderización.
      "worker-src blob:",
      "child-src blob:",
    ].join('; ')
  );

  next();
}

// ── 3. Rate limiting para login de administrador ──────────────────────────────
export const adminLoginLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  skipSuccessfulRequests: true,
  handler(req, res) {
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

// ── 5. Rate limiting general ──────────────────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs:        1 * 60 * 1000,
  max:             200,
  standardHeaders: true,
  legacyHeaders:   false,
  skip: (req) => req.path.startsWith('/css') || req.path.startsWith('/js'),
});

// ── 6. Proteger archivos de uploads ──────────────────────────────────────────
export function protectUploads(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).send('No autorizado.');
  }
  next();
}

// ── 7. Validar :id como número entero positivo ────────────────────────────────
export function validateIdParam(req, res, next) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'ID inválido.' });
  }
  req.params.id = id;
  next();
}

// ── 8. Validar variables de entorno ──────────────────────────────────────────
export function validateEnv() {
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'SESSION_SECRET'];
  const missing  = required.filter(k => !process.env[k]);

  if (missing.length > 0) {
    console.error('❌  Variables de entorno faltantes:', missing.join(', '));
    process.exit(1);
  }

  if (process.env.SESSION_SECRET === 'fumiDorado_dev_secret') {
    console.warn('⚠️   SESSION_SECRET está usando el valor por defecto. Cámbialo antes de producción.');
  }
}