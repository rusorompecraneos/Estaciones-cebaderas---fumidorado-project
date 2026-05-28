/**
 * services/authService.js
 * Lógica de negocio para autenticación.
 * Aquí irá la consulta real a la DB cuando tengas el modelo listo.
 */

'use strict';

// TODO: importar el repositorio cuando esté implementado
// const authRepository = require('../repositories/authRepository');

// ── Constantes ───────────────────────────────────────────────────────────────
const VALID_ROLES = ['admin', 'tecnico'];

/**
 * Valida y sanitiza las credenciales recibidas del formulario.
 * Retorna { valid: bool, errors: {} }
 */
function validateCredentials({ username, password, role }) {
  const errors = {};

  // Username
  const user = (username || '').trim();
  if (!user) {
    errors.username = 'El usuario es requerido.';
  } else if (user.length < 3 || user.length > 50) {
    errors.username = 'El usuario debe tener entre 3 y 50 caracteres.';
  } else if (!/^[a-zA-Z0-9._-]+$/.test(user)) {
    errors.username = 'El usuario contiene caracteres no permitidos.';
  }

  // Password
  const pass = password || '';
  if (!pass) {
    errors.password = 'La contraseña es requerida.';
  } else if (pass.length < 6) {
    errors.password = 'La contraseña debe tener mínimo 6 caracteres.';
  } else if (pass.length > 128) {
    errors.password = 'La contraseña es demasiado larga.';
  }

  // Role
  if (!role || !VALID_ROLES.includes(role)) {
    errors.role = 'Debe seleccionar un tipo de acceso válido.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: { username: user, role },
  };
}

/**
 * Intenta autenticar al usuario contra la base de datos.
 * Por ahora usa usuarios de prueba en memoria.
 * REEMPLAZAR con authRepository.findByUsername() cuando la DB esté lista.
 *
 * @returns {{ success: bool, user: object|null, message: string }}
 */
async function authenticateUser({ username, password, role }) {

  // ─── MOCK temporal — eliminar cuando conectes PostgreSQL ─────────────────
  const MOCK_USERS = [
    {
      id: 1,
      username: 'admin',
      // En producción esto será un hash bcrypt desde la DB
      password: 'admin123',
      role: 'admin',
      nombre: 'Administrador FumiDorado',
    },
    {
      id: 2,
      username: 'tecnico1',
      password: 'tecnico123',
      role: 'tecnico',
      nombre: 'Carlos M. Pérez',
    },
  ];

  const user = MOCK_USERS.find(u => u.username === username);

  if (!user) {
    return { success: false, message: 'Credenciales incorrectas.' };
  }

  // Verificar contraseña (mock: comparación directa)
  // TODO: reemplazar con bcrypt.compare(password, user.passwordHash)
  const passwordMatch = user.password === password;

  if (!passwordMatch) {
    return { success: false, message: 'Credenciales incorrectas.' };
  }

  // Verificar que el rol coincida con el seleccionado
  if (user.role !== role) {
    return {
      success: false,
      message: `Este usuario no tiene acceso como "${role === 'admin' ? 'Administrador' : 'Técnico'}".`,
    };
  }

  // ─── FIN MOCK ─────────────────────────────────────────────────────────────

  // Retornar datos de sesión (sin contraseña)
  return {
    success: true,
    user: {
      id:       user.id,
      username: user.username,
      role:     user.role,
      nombre:   user.nombre,
    },
  };
}

export default {
  validateCredentials,
  authenticateUser,
  VALID_ROLES,
};

// comentarios de funciones para explicar cada paso del proceso de autenticación, validación y manejo de errores. 