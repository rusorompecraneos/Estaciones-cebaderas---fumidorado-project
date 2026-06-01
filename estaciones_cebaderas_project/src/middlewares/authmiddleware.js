// src/middlewares/auth.middleware.js

// ── isAuthenticated ───────────────────────────────────────────────────────────
/**
 * Protege rutas que requieren sesión activa.
 * Inyecta currentUser en res.locals para que esté disponible en todas las vistas.
 */
export function isAuthenticated(req, res, next) {
  if (req.session?.user) {
    res.locals.currentUser = req.session.user;
    return next();
  }
  req.session.returnTo = req.originalUrl;
  return res.redirect('/auth/login');
}

// ── guestOnly ─────────────────────────────────────────────────────────────────
/**
 * Solo permite acceso a usuarios NO autenticados.
 * Si ya hay sesión, redirige al dashboard correspondiente.
 */
export function guestOnly(req, res, next) {
  if (req.session?.user) {
    const routes = { admin: '/admin/dashboard', tecnico: '/tecnico/dashboard' };
    return res.redirect(routes[req.session.user.role] || '/auth/role');
  }
  return next();
}

// ── requireRole ───────────────────────────────────────────────────────────────
/**
 * Middleware de fábrica: restringe acceso por rol.
 *
 * Uso:
 *   router.get('/dashboard', isAuthenticated, requireRole('admin'), handler)
 *   router.get('/visita',    isAuthenticated, requireRole('admin', 'tecnico'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.user) return res.redirect('/auth/login');

    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('errors/403', {
        title:       'Acceso denegado — FumiDorado',
        currentUser: req.session.user,
        message:     'No tienes permisos para acceder a esta sección.',
      });
    }
    return next();
  };
}