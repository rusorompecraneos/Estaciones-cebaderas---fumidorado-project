// src/models/tecnico.model.js

/**
 * Mapea una fila de la tabla `tecnicos` a un objeto seguro
 * (sin exponer el hash del PIN).
 */
export function mapTecnico(row) {
  return {
    id:        row.id,
    nombre:    row.nombre,
    iniciales: row.iniciales,
    email:     row.email,
    telefono:  row.telefono,
    activo:    row.activo,
    createdAt: row.created_at,
  };
}

/**
 * Mapea solo los campos públicos necesarios para el desplegable
 * de selección (nunca el PIN).
 */
export function mapTecnicoPublico(row) {
  return {
    id:        row.id,
    nombre:    row.nombre,
    iniciales: row.iniciales,
  };
}

/**
 * Valida input para crear un técnico nuevo.
 */
export function validateTecnicoInput({ nombre, iniciales, pin }) {
  const errors = {};

  if (!nombre || nombre.trim().length < 2)
    errors.nombre = 'El nombre es requerido.';

  if (!iniciales || iniciales.trim().length < 1)
    errors.iniciales = 'Las iniciales son requeridas.';

  if (!pin || !/^\d{4}$/.test(pin))
    errors.pin = 'El PIN debe ser exactamente 4 dígitos numéricos.';

  return { valid: Object.keys(errors).length === 0, errors };
}