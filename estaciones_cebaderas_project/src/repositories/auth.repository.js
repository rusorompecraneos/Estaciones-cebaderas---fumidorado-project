// src/repositories/auth.repository.js
// Toda la lógica de acceso a la DB para autenticación.
// Los servicios llaman a este repositorio; nunca al pool directamente.

import pool from '../config/db.config.js';
// ── ADMINISTRADORES ──────────────────────────────────────────────────────────

/**
 * Busca un admin por username.
 * Devuelve la fila completa (incluyendo password hash) — solo para uso interno.
 */
export async function findAdminByUsername(username) {
  const { rows } = await pool.query(
    `SELECT id, username, password, nombre, email, activo
     FROM administradores
     WHERE username = $1
     LIMIT 1`,
    [username.trim().toLowerCase()]
  );
  return rows[0] || null;
}

/**
 * Busca un admin por id.
 */
export async function findAdminById(id) {
  const { rows } = await pool.query(
    `SELECT id, username, nombre, email, activo
     FROM administradores
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// ── TÉCNICOS ─────────────────────────────────────────────────────────────────

/**
 * Devuelve todos los técnicos activos para el desplegable.
 * Solo campos públicos — nunca el PIN.
 */
export async function findAllTecnicosActivos() {
  const { rows } = await pool.query(
    `SELECT id, nombre, iniciales
     FROM tecnicos
     WHERE activo = TRUE
     ORDER BY nombre ASC`
  );
  return rows;
}

/**
 * Busca un técnico por id.
 * Incluye el pin hash — solo para verificación interna.
 */
export async function findTecnicoById(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, iniciales, pin, activo
     FROM tecnicos
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}