/**
 * controllers/authController.js
 */

'use strict';

import authService  from '../services/auth.service.js';

// ── GET /auth/role ────────────────────────────────────────────────────────────
function showRoleSelect(req, res) {
  if (req.session && req.session.user) return redirectByRole(res, req.session.user.role);
  return res.render('auth/role-select', { title: 'Acceso — FumiDorado' });
}

// ── GET /auth/login  (admin) ──────────────────────────────────────────────────
function showLogin(req, res) {
  if (req.session && req.session.user) return redirectByRole(res, req.session.user.role);
  return res.render('auth/login', {
    title:       'Administrador — FumiDorado',
    error:       req.flash ? req.flash('error')[0] || null : null,
    fieldErrors: {},
    formData:    { username: '' },
  });
}

// ── POST /auth/login ──────────────────────────────────────────────────────────
async function handleLogin(req, res) {
  const { username, password } = req.body;

  const { valid, errors, sanitized } = authService.validateCredentials({
    username,
    password,
    role: 'admin',
  });

  if (!valid) {
    return res.status(422).render('auth/login', {
      title:       'Administrador — FumiDorado',
      error:       null,
      fieldErrors: errors,
      formData:    { username: (username || '').trim() },
    });
  }

  try {
    const result = await authService.authenticateUser({
      username: sanitized.username,
      password,
      role: 'admin',
    });

    if (!result.success) {
      return res.status(401).render('auth/login', {
        title:       'Administrador — FumiDorado',
        error:       result.message,
        fieldErrors: {},
        formData:    { username: sanitized.username },
      });
    }

    req.session.regenerate((err) => {
      if (err) return _serverError(res, 'auth/login', sanitized.username);
      req.session.user = result.user;
      return redirectByRole(res, result.user.role);
    });

  } catch (err) {
    console.error('[AuthController] handleLogin error:', err);
    return _serverError(res, 'auth/login', (username || '').trim());
  }
}

// ── GET /auth/tecnico ─────────────────────────────────────────────────────────
function showTecnicoAccess(req, res) {
  if (req.session && req.session.user) return redirectByRole(res, req.session.user.role);
  return res.render('auth/tecnico-access', {
    title:    'Acceso Técnico — FumiDorado',
    tecnicos: authService.getMockTecnicos(),
    error:    null,
  });
}

// ── POST /auth/tecnico/verify  (AJAX) ─────────────────────────────────────────
async function verifyTecnicoPin(req, res) {
  const { tecnicoId, pin } = req.body;

  // Validación básica
  if (!tecnicoId || !pin || !/^\d{4}$/.test(pin)) {
    return res.json({ success: false, message: 'Datos inválidos.' });
  }

  try {
    const result = await authService.authenticateTecnico({ tecnicoId, pin });

    if (!result.success) {
      return res.json({ success: false, message: result.message });
    }

    req.session.regenerate((err) => {
      if (err) return res.json({ success: false, message: 'Error de sesión.' });
      req.session.user = result.user;
      // Por ahora retornamos success; el redirect lo hace el cliente
      return res.json({ success: true, redirect: '/tecnico/dashboard' });
    });

  } catch (err) {
    console.error('[AuthController] verifyTecnicoPin error:', err);
    return res.json({ success: false, message: 'Error interno. Intente nuevamente.' });
  }
}

// ── GET /auth/logout ──────────────────────────────────────────────────────────
function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('[AuthController] logout error:', err);
    res.clearCookie('connect.sid');
    return res.redirect('/auth/role');
  });
}

// ── GET /auth/forgot-password ─────────────────────────────────────────────────
function showForgotPassword(req, res) {
  // TODO: implementar vista de recuperación
  return res.redirect('/auth/login');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function redirectByRole(res, role) {
  const routes = { admin: '/admin/dashboard', tecnico: '/tecnico/dashboard' };
  return res.redirect(routes[role] || '/auth/role');
}

function _serverError(res, view, username) {
  return res.status(500).render(`auth/${view}`, {
    title:       'Error — FumiDorado',
    error:       'Error interno. Intente nuevamente.',
    fieldErrors: {},
    formData:    { username },
  });
}

export default {
  showRoleSelect,
  showLogin,
  handleLogin,
  showTecnicoAccess,
  verifyTecnicoPin,
  handleLogout,
  showForgotPassword,
};
