// src/models/admin.model.js
// Define la estructura esperada de un administrador.
// No usamos un ORM, pero este modelo sirve como documentación
// y para mapear filas de la DB a objetos limpios.

/**
 * Mapea una fila de la tabla `administradores` a un objeto seguro
 * (sin exponer el hash de la contraseña).
 *
 * @param {Object} row - Fila devuelta por pg
 * @returns {Object}
 */
export function mapAdmin(row) {
  return {
    id:        row.id,
    username:  row.username,
    nombre:    row.nombre,
    email:     row.email,
    activo:    row.activo,
    createdAt: row.created_at,
  };
}

/**
 * Valida que un objeto tenga los campos mínimos para un admin.
 * Usado en el servicio antes de insertar.
 */
export function validateAdminInput({ username, password, nombre }) {
  const errors = {};

  if (!username || username.trim().length < 3)
    errors.username = 'El usuario debe tener mínimo 3 caracteres.';

  if (!password || password.length < 8)
    errors.password = 'La contraseña debe tener mínimo 8 caracteres.';

  if (!nombre || nombre.trim().length < 2)
    errors.nombre = 'El nombre es requerido.';

  return { valid: Object.keys(errors).length === 0, errors };
}