/**
 * controllers/authController.js
 * Maneja las peticiones HTTP relacionadas con autenticación.
 */

'use strict';

import authService from '../services/auth.service.js';

// ── GET /auth/login ──────────────────────────────────────────────────────────
/**
 * Muestra la vista de selección de rol / login.
 * Si ya hay sesión activa, redirige al dashboard correspondiente.
 */
function showLogin(req, res) {
  // Si ya hay sesión, redirigir
  if (req.session && req.session.user) {
    return redirectByRole(res, req.session.user.role);
  }

  return res.render('auth/role-select', {
    title:       'Acceso al sistema — FumiDorado',
    error:       null,
    fieldErrors: {},
    formData:    { username: '' },
  });
}

// ── POST /auth/login ─────────────────────────────────────────────────────────
/**
 * Procesa las credenciales del formulario.
 * Flujo:
 *  1. Validar campos (server-side)
 *  2. Autenticar contra la DB
 *  3. Crear sesión y redirigir — o volver al formulario con errores
 */
async function handleLogin(req, res) {
  const { username, password, role } = req.body;

  // 1. Validar
  const { valid, errors, sanitized } = authService.validateCredentials({
    username,
    password,
    role,
  });

  if (!valid) {
    return res.status(422).render('auth/role-select', {
      title:       'Acceso al sistema — FumiDorado',
      error:       null,
      fieldErrors: errors,
      formData:    { username: (username || '').trim() },
    });
  }

  // 2. Autenticar
  try {
    const result = await authService.authenticateUser({
      username: sanitized.username,
      password,
      role:     sanitized.role,
    });

    if (!result.success) {
      return res.status(401).render('auth/role-select', {
        title:       'Acceso al sistema — FumiDorado',
        error:       result.message,
        fieldErrors: {},
        formData:    { username: sanitized.username },
      });
    }

    // 3. Crear sesión
    req.session.user = result.user;

    // Regenerar session ID para prevenir session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('[AuthController] Error regenerando sesión:', err);
        return res.status(500).render('auth/role-select', {
          title:       'Acceso al sistema — FumiDorado',
          error:       'Error interno. Intente nuevamente.',
          fieldErrors: {},
          formData:    { username: sanitized.username },
        });
      }

      // Restaurar usuario en la sesión regenerada
      req.session.user = result.user;

      // Redirigir según rol
      return redirectByRole(res, result.user.role);
    });

  } catch (err) {
    console.error('[AuthController] Error inesperado en login:', err);
    return res.status(500).render('auth/role-select', {
      title:       'Acceso al sistema — FumiDorado',
      error:       'Ocurrió un error inesperado. Intente nuevamente.',
      fieldErrors: {},
      formData:    { username: (username || '').trim() },
    });
  }
}

// ── POST /auth/logout ────────────────────────────────────────────────────────
/**
 * Destruye la sesión y redirige al login.
 */
function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('[AuthController] Error destruyendo sesión:', err);
    }
    res.clearCookie('connect.sid');
    return res.redirect('/auth/login');
  });
}

// ── GET /auth/forgot-password ────────────────────────────────────────────────
/**
 * Placeholder para la vista de recuperación de contraseña.
 * Implementar en la siguiente iteración.
 */
function showForgotPassword(req, res) {
  // TODO: implementar vista y lógica de recuperación
  return res.redirect('/auth/login');
}

// ── Helper ───────────────────────────────────────────────────────────────────
/**
 * Redirige al dashboard correspondiente según el rol del usuario.
 */
function redirectByRole(res, role) {
  const routes = {
    admin:   '/admin/dashboard',
    tecnico: '/tecnico/dashboard',
  };
  return res.redirect(routes[role] || '/auth/login');
}

export default {
  showLogin,
  handleLogin,
  handleLogout,
  showForgotPassword,
};