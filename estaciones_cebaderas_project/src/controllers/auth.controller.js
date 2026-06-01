// src/controllers/auth.controller.js

import * as authService from '../services/auth.service.js';

// ── GET /auth/role ────────────────────────────────────────────────────────────
export function showRoleSelect(req, res) {
  if (req.session?.user) return _redirectByRole(res, req.session.user.role);
  return res.render('auth/role-select', { title: 'Acceso — FumiDorado' });
}

// ── GET /auth/login ───────────────────────────────────────────────────────────
export function showLogin(req, res) {
  if (req.session?.user) return _redirectByRole(res, req.session.user.role);
  return res.render('auth/login', {
    title:       'Administrador — FumiDorado',
    error:       null,
    fieldErrors: {},
    formData:    { username: '' },
  });
}

// ── POST /auth/login ──────────────────────────────────────────────────────────
export async function handleLogin(req, res) {
  const { username, password } = req.body;

  // 1. Validar campos
  const { valid, errors, sanitized } = authService.validateLoginInput({ username, password });

  if (!valid) {
    return res.status(422).render('auth/login', {
      title:       'Administrador — FumiDorado',
      error:       null,
      fieldErrors: errors,
      formData:    { username: (username || '').trim() },
    });
  }

  // 2. Autenticar contra DB
  try {
    const result = await authService.authenticateAdmin({
      username: sanitized.username,
      password,
    });

    if (!result.success) {
      return res.status(401).render('auth/login', {
        title:       'Administrador — FumiDorado',
        error:       result.message,
        fieldErrors: {},
        formData:    { username: sanitized.username },
      });
    }

    // 3. Crear sesión
    req.session.regenerate((err) => {
      if (err) {
        console.error('[auth.controller] Error regenerando sesión:', err);
        return res.status(500).render('auth/login', {
          title:       'Administrador — FumiDorado',
          error:       'Error interno. Intente nuevamente.',
          fieldErrors: {},
          formData:    { username: sanitized.username },
        });
      }
      req.session.user = { ...result.user, role: 'admin' };
      return _redirectByRole(res, 'admin');
    });

  } catch (err) {
    console.error('[auth.controller] handleLogin error:', err);
    return res.status(500).render('auth/login', {
      title:       'Administrador — FumiDorado',
      error:       'Error interno. Intente nuevamente.',
      fieldErrors: {},
      formData:    { username: (username || '').trim() },
    });
  }
}

// ── GET /auth/tecnico ─────────────────────────────────────────────────────────
export async function showTecnicoAccess(req, res) {
  if (req.session?.user) return _redirectByRole(res, req.session.user.role);

  try {
    const tecnicos = await authService.getTecnicosActivos();
    return res.render('auth/tecnico-access', {
      title:    'Acceso Técnico — FumiDorado',
      tecnicos,
      error:    null,
    });
  } catch (err) {
    console.error('[auth.controller] showTecnicoAccess error:', err);
    return res.render('auth/tecnico-access', {
      title:    'Acceso Técnico — FumiDorado',
      tecnicos: [],
      error:    'No se pudo cargar la lista de técnicos. Intente nuevamente.',
    });
  }
}

// ── POST /auth/tecnico/verify  (AJAX) ─────────────────────────────────────────
export async function verifyTecnicoPin(req, res) {
  const { tecnicoId, pin } = req.body;

  // Validación básica de entrada
  if (!tecnicoId || !pin) {
    return res.status(400).json({ success: false, message: 'Datos incompletos.' });
  }

  const id = parseInt(tecnicoId, 10);
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: 'ID de técnico inválido.' });
  }

  try {
    const result = await authService.authenticateTecnico({ tecnicoId: id, pin });

    if (!result.success) {
      return res.status(401).json({ success: false, message: result.message });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('[auth.controller] Error regenerando sesión técnico:', err);
        return res.status(500).json({ success: false, message: 'Error de sesión.' });
      }
      req.session.user = result.user;
      return res.json({ success: true, redirect: '/tecnico/dashboard' });
    });

  } catch (err) {
    console.error('[auth.controller] verifyTecnicoPin error:', err);
    return res.status(500).json({ success: false, message: 'Error interno. Intente nuevamente.' });
  }
}

// ── GET /auth/logout ──────────────────────────────────────────────────────────
export function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) console.error('[auth.controller] logout error:', err);
    res.clearCookie('connect.sid');
    return res.redirect('/auth/role');
  });
}

// ── GET /auth/forgot-password ─────────────────────────────────────────────────
export function showForgotPassword(req, res) {
  // TODO: implementar en próxima iteración
  return res.redirect('/auth/login');
}

// ── Helper privado ────────────────────────────────────────────────────────────
function _redirectByRole(res, role) {
  const routes = {
    admin:   '/admin/dashboard',
    tecnico: '/tecnico/dashboard',
  };
  return res.redirect(routes[role] || '/auth/role-select');
}
