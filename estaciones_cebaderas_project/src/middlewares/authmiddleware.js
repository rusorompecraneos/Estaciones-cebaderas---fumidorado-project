/**
 * middlewares/authMiddleware.js
 * Protección de rutas por sesión y rol.
 */

'use strict';

/**
 * isAuthenticated
 * Protege rutas que requieren sesión activa.
 * Si no hay sesión, redirige a /auth/login.
 */
export function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    // Adjuntar usuario a res.locals para que esté disponible en todas las vistas
    res.locals.currentUser = req.session.user;
    return next();
  }

  // Guardar la URL original para redirigir después del login (opcional)
  req.session.returnTo = req.originalUrl;
  return res.redirect('/auth/login');
}

/**
 * guestOnly
 * Solo permite acceso a usuarios NO autenticados.
 */
export function guestOnly(req, res, next) {
  if (req.session && req.session.user) {
    const role = req.session.user.role;

    const dashboards = {
      admin: '/admin/dashboard',
      tecnico: '/tecnico/dashboard',
    };

    return res.redirect(dashboards[role] || '/auth/login');
  }

  return next();
}

/**
 * requireRole(...roles)
 * Middleware de fábrica: restringe el acceso según rol.
 */
export function requireRole(...roles) {
  return function (req, res, next) {

    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }

    const userRole = req.session.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).render('errors/403', {
        title: 'Acceso denegado',
        currentUser: req.session.user,
        message: 'No tienes permisos para acceder a esta sección.',
      });
    }

    return next();
  };
}