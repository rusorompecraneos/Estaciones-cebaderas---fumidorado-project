/**
 * services/authService.js
 */

'use strict';

const VALID_ROLES = ['admin', 'tecnico'];

// ── MOCK temporal — reemplazar con queries a PostgreSQL ──────────────────────

const MOCK_ADMINS = [
  { id: 1, username: 'admin',   password: 'admin123', role: 'admin', nombre: 'Administrador FumiDorado' },
  { id: 2, username: 'jgomez',  password: 'admin123', role: 'admin', nombre: 'Juan Gómez' },
];

const MOCK_TECNICOS = [
  { id: 1, nombre: 'Carlos M. Pérez',   iniciales: 'CP', pin: '1234' },
  { id: 2, nombre: 'Andrés F. Ramírez', iniciales: 'AR', pin: '2580' },
  { id: 3, nombre: 'Laura V. Torres',   iniciales: 'LT', pin: '3691' },
  { id: 4, nombre: 'Miguel A. Suárez',  iniciales: 'MS', pin: '1470' },
];

// ── Validaciones ─────────────────────────────────────────────────────────────

function validateCredentials({ username, password, role }) {
  const errors = {};

  const user = (username || '').trim();
  if (!user)               errors.username = 'El usuario es requerido.';
  else if (user.length < 3) errors.username = 'Mínimo 3 caracteres.';
  else if (user.length > 50) errors.username = 'Máximo 50 caracteres.';
  // else if (!/^[a-zA-Z0-9._@-]+$/.test(user)) errors.username = 'Solo letras, números, puntos y guiones.';   // revisar el tema del "@".

  const pass = password || '';
  if (!pass)               errors.password = 'La contraseña es requerida.';
  else if (pass.length < 6) errors.password = 'Mínimo 6 caracteres.';
  else if (pass.length > 128) errors.password = 'Contraseña demasiado larga.';

  if (role && !VALID_ROLES.includes(role)) errors.role = 'Rol no válido.';

  return { valid: Object.keys(errors).length === 0, errors, sanitized: { username: user, role } };
}

// ── Autenticación admin ───────────────────────────────────────────────────────

async function authenticateUser({ username, password, role }) {
  // TODO: reemplazar con authRepository.findByUsername(username)
  const user = MOCK_ADMINS.find(u => u.username === username);
  if (!user) return { success: false, message: 'Credenciales incorrectas.' };

  // TODO: reemplazar con bcrypt.compare(password, user.passwordHash)
  if (user.password !== password) return { success: false, message: 'Credenciales incorrectas.' };

  if (user.role !== role) {
    return { success: false, message: 'Este usuario no tiene acceso como administrador.' };
  }

  return {
    success: true,
    user: { id: user.id, username: user.username, role: user.role, nombre: user.nombre },
  };
}

// ── Autenticación técnico (PIN) ───────────────────────────────────────────────

async function authenticateTecnico({ tecnicoId, pin }) {
  // TODO: reemplazar con tecnicoRepository.findById(tecnicoId)
  const tecnico = MOCK_TECNICOS.find(t => t.id === parseInt(tecnicoId, 10));
  if (!tecnico) return { success: false, message: 'Técnico no encontrado.' };

  // TODO: reemplazar con bcrypt.compare(pin, tecnico.pinHash)
  if (tecnico.pin !== pin) return { success: false, message: 'PIN incorrecto. Intente nuevamente.' };

  return {
    success: true,
    user: { id: tecnico.id, username: tecnico.nombre, role: 'tecnico', nombre: tecnico.nombre },
  };
}

// ── Helpers públicos ──────────────────────────────────────────────────────────

function getMockTecnicos() {
  // Solo exponer id, nombre e iniciales — nunca el PIN
  return MOCK_TECNICOS.map(({ id, nombre, iniciales }) => ({ id, nombre, iniciales }));
}
export default {
  validateCredentials,
  authenticateUser,
  authenticateTecnico,
  getMockTecnicos,
  VALID_ROLES,
};
