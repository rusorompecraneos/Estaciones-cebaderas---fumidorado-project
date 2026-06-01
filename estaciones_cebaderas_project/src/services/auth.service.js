// src/services/auth.service.js
// Lógica de negocio: validaciones, bcrypt, llamadas al repositorio.

import bcrypt from 'bcrypt';
import * as authRepo from '../repositories/auth.repository.js';
import { mapAdmin } from '../models/admin.model.js';
import { mapTecnicoPublico } from '../models/tecnico.model.js';

// ── VALIDACIONES DE FORMULARIO ───────────────────────────────────────────────

/**
 * Valida los campos del formulario de login de admin.
 * (Validación server-side — complementa la del cliente)
 */
export function validateLoginInput({ username, password }) {
  const errors = {};

  const user = (username || '').trim();
  if (!user)                errors.username = 'El usuario es requerido.';
  else if (user.length < 3)  errors.username = 'Mínimo 3 caracteres.';
  else if (user.length > 50) errors.username = 'Máximo 50 caracteres.';
  else if (!/^[a-zA-Z0-9._-]+$/.test(user))
    errors.username = 'Solo letras, números, puntos y guiones.';

  const pass = password || '';
  if (!pass)                errors.password = 'La contraseña es requerida.';
  else if (pass.length < 6)  errors.password = 'Mínimo 6 caracteres.';
  else if (pass.length > 128) errors.password = 'Contraseña demasiado larga.';

  return { valid: Object.keys(errors).length === 0, errors, sanitized: { username: user } };
}

// ── AUTENTICACIÓN ADMIN ──────────────────────────────────────────────────────

/**
 * Autentica un administrador contra la DB.
 * Usa bcrypt para verificar el hash de la contraseña.
 *
 * @returns {{ success: boolean, user?: object, message?: string }}
 */
export async function authenticateAdmin({ username, password }) {
  // 1. Buscar en DB
  const row = await authRepo.findAdminByUsername(username);

  if (!row) {
    // No revelar si el usuario existe o no (seguridad)
    return { success: false, message: 'Usuario o contraseña incorrectos.' };
  }

  // 2. Verificar que esté activo
  if (!row.activo) {
    return { success: false, message: 'Esta cuenta está desactivada. Contacte al administrador.' };
  }

  // 3. Comparar contraseña con bcrypt
  const match = await bcrypt.compare(password, row.password);
  if (!match) {
    return { success: false, message: 'Usuario o contraseña incorrectos.' };
  }

  // 4. Retornar datos de sesión (sin el hash)
  return {
    success: true,
    user: mapAdmin(row),
  };
}

// ── AUTENTICACIÓN TÉCNICO (PIN) ──────────────────────────────────────────────

/**
 * Autentica un técnico por id + PIN de 4 dígitos.
 * Usa bcrypt para verificar el hash del PIN.
 */
export async function authenticateTecnico({ tecnicoId, pin }) {
  // 1. Validar formato del PIN
  if (!pin || !/^\d{4}$/.test(pin)) {
    return { success: false, message: 'El PIN debe ser de 4 dígitos numéricos.' };
  }

  // 2. Buscar técnico en DB
  const row = await authRepo.findTecnicoById(tecnicoId);

  if (!row) {
    return { success: false, message: 'Técnico no encontrado.' };
  }

  // 3. Verificar que esté activo
  if (!row.activo) {
    return { success: false, message: 'Este técnico está desactivado. Contacte al administrador.' };
  }

  // 4. Comparar PIN con bcrypt
  const match = await bcrypt.compare(pin, row.pin);
  if (!match) {
    return { success: false, message: 'PIN incorrecto. Intente nuevamente.' };
  }

  // 5. Retornar datos de sesión
  return {
    success: true,
    user: {
      id:        row.id,
      username:  row.nombre,
      nombre:    row.nombre,
      iniciales: row.iniciales,
      role:      'tecnico',
    },
  };
}

// ── HELPERS PÚBLICOS ─────────────────────────────────────────────────────────

/**
 * Obtiene la lista de técnicos activos para el desplegable.
 * Solo devuelve id, nombre e iniciales — nunca el PIN.
 */
export async function getTecnicosActivos() {
  const rows = await authRepo.findAllTecnicosActivos();
  return rows.map(mapTecnicoPublico);
}