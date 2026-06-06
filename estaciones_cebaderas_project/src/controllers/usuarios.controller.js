// src/controllers/usuarios.controller.js

import * as service from '../services/usuarios.service.js';

// ── GET /admin/usuarios ───────────────────────────────────────────────────────
export async function showUsuarios(req, res) {
  try {
    const [admins, tecnicos] = await Promise.all([
      service.getAdmins(),
      service.getTecnicos(),
    ]);
    return res.render('admin/usuarios', {
      title:       'Gestión de Usuarios — FumiDorado',
      currentUser: req.session.user,
      admins,
      tecnicos,
    });
  } catch (err) {
    console.error('[usuarios.controller] showUsuarios:', err);
    return res.render('admin/usuarios', {
      title:       'Gestión de Usuarios — FumiDorado',
      currentUser: req.session.user,
      admins:      [],
      tecnicos:    [],
    });
  }
}

// ── ADMINS ────────────────────────────────────────────────────────────────────

// POST /admin/usuarios/admins  (AJAX)
export async function crearAdmin(req, res) {
  const { nombre, username, email, password, telefono } = req.body;

  const { valid, errors } = service.validateAdmin({ nombre, username, email, password, telefono });
  if (!valid) return res.status(422).json({ success: false, errors });

  try {
    const result = await service.createAdmin({ nombre, username, email, password, telefono });
    if (!result.success) {
      return res.status(409).json({ success: false, errors: { [result.field]: result.message } });
    }
    return res.json({ success: true, id: result.id });
  } catch (err) {
    console.error('[usuarios.controller] crearAdmin:', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
}

// PUT /admin/usuarios/admins/:id  (AJAX)
export async function editarAdmin(req, res) {
  const { nombre, username, email, password, telefono } = req.body;
  const id = req.params.id;

  const { valid, errors } = service.validateAdmin({ nombre, username, email, password, telefono }, true);
  if (!valid) return res.status(422).json({ success: false, errors });

  try {
    const result = await service.updateAdmin(
      { id, nombre, username, email, password, telefono },
      req.session.user.id
    );
    if (!result.success) {
      return res.status(409).json({ success: false, errors: { [result.field || 'general']: result.message } });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[usuarios.controller] editarAdmin:', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
}

// DELETE /admin/usuarios/admins/:id  (AJAX)
export async function eliminarAdmin(req, res) {
  try {
    const result = await service.deleteAdmin(req.params.id, req.session.user.id);
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[usuarios.controller] eliminarAdmin:', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
}

// ── TÉCNICOS ──────────────────────────────────────────────────────────────────

// POST /admin/usuarios/tecnicos  (AJAX)
export async function crearTecnico(req, res) {
  const { nombre, iniciales, email, telefono, pin } = req.body;

  const { valid, errors } = service.validateTecnico({ nombre, iniciales, email, pin });
  if (!valid) return res.status(422).json({ success: false, errors });

  try {
    const result = await service.createTecnico({ nombre, iniciales, email, telefono, pin });
    if (!result.success) {
      return res.status(409).json({ success: false, errors: { [result.field]: result.message } });
    }
    return res.json({ success: true, id: result.id });
  } catch (err) {
    console.error('[usuarios.controller] crearTecnico:', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
}

// PUT /admin/usuarios/tecnicos/:id  (AJAX)
export async function editarTecnico(req, res) {
  const { nombre, iniciales, email, telefono, pin } = req.body;
  const id = req.params.id;

  const { valid, errors } = service.validateTecnico({ nombre, iniciales, email, pin }, true);
  if (!valid) return res.status(422).json({ success: false, errors });

  try {
    const result = await service.updateTecnico({ id, nombre, iniciales, email, telefono, pin });
    if (!result.success) {
      return res.status(409).json({ success: false, errors: { [result.field || 'general']: result.message } });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[usuarios.controller] editarTecnico:', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
}

// DELETE /admin/usuarios/tecnicos/:id  (AJAX)
export async function eliminarTecnico(req, res) {
  try {
    const result = await service.deleteTecnico(req.params.id);
    if (!result.success) return res.status(400).json({ success: false, message: result.message });
    return res.json({ success: true });
  } catch (err) {
    console.error('[usuarios.controller] eliminarTecnico:', err);
    return res.status(500).json({ success: false, message: 'Error interno.' });
  }
}