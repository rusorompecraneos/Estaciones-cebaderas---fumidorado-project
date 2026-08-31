// src/repositories/usuarios.repository.js

import pool from '../config/db.config.js';

// ── ADMINISTRADORES ──────────────────────────────────────────────────────────

export async function findAllAdmins() {
  const { rows } = await pool.query(
    `SELECT id, username, nombre, email, telefono, activo, created_at
     FROM administradores
     ORDER BY nombre ASC`
  );
  return rows;
}

export async function findAdminById(id) {
  const { rows } = await pool.query(
    `SELECT id, username, nombre, email, telefono, activo
     FROM administradores WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findAdminByUsername(username) {
  const { rows } = await pool.query(
    `SELECT id FROM administradores WHERE username = $1 LIMIT 1`,
    [username.trim().toLowerCase()]
  );
  return rows[0] || null;
}

export async function findAdminByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id FROM administradores WHERE email = $1 LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  return rows[0] || null;
}

export async function createAdmin({ username, passwordHash, nombre, email, telefono }) {
  const { rows } = await pool.query(
    `INSERT INTO administradores (username, password, nombre, email, telefono)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [username.trim().toLowerCase(), passwordHash, nombre.trim(), email.trim().toLowerCase(), telefono?.trim() || null]
  );
  return rows[0].id;
}

export async function updateAdmin({ id, nombre, email, username, telefono }) {
  await pool.query(
    `UPDATE administradores
     SET nombre = $1, email = $2, username = $3, telefono = $4, updated_at = NOW()
     WHERE id = $5`,
    [nombre.trim(), email.trim().toLowerCase(), username.trim().toLowerCase(), telefono?.trim() || null, id]
  );
}

export async function updateAdminPassword({ id, passwordHash }) {
  await pool.query(
    `UPDATE administradores SET password = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, id]
  );
}

export async function deleteAdmin(id) {
  await pool.query(`DELETE FROM administradores WHERE id = $1`, [id]);
}

// ── TÉCNICOS ─────────────────────────────────────────────────────────────────

export async function findAllTecnicos() {
  const { rows } = await pool.query(
    `SELECT id, nombre, iniciales, email, telefono, activo, created_at
     FROM tecnicos
     WHERE activo = TRUE
     ORDER BY nombre ASC`
  );
  return rows;
}

export async function findTecnicoById(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, iniciales, email, telefono, activo
     FROM tecnicos WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findTecnicoByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id 
    FROM tecnicos 
    WHERE email = $1 
    AND activo = TRUE
    LIMIT 1`,
    [email.trim().toLowerCase()]
  );
  return rows[0] || null;
}

export async function createTecnico({ nombre, iniciales, pinHash, email, telefono }) {
  const { rows } = await pool.query(
    `INSERT INTO tecnicos (nombre, iniciales, pin, email, telefono)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [nombre.trim(), iniciales.trim().toUpperCase(), pinHash,
     email?.trim().toLowerCase() || null,
     telefono?.trim() || null]
  );
  return rows[0].id;
}

export async function updateTecnico({ id, nombre, iniciales, email, telefono }) {
  await pool.query(
    `UPDATE tecnicos
     SET nombre = $1, iniciales = $2, email = $3, telefono = $4
     WHERE id = $5`,
    [nombre.trim(), iniciales.trim().toUpperCase(),
     email?.trim().toLowerCase() || null,
     telefono?.trim() || null, id]
  );
}

export async function updateTecnicoPin({ id, pinHash }) {
  await pool.query(
    `UPDATE tecnicos SET pin = $1 WHERE id = $2`,
    [pinHash, id]
  );
}

export async function deleteTecnico(id) {
  await pool.query(
    `UPDATE tecnicos SET activo = FALSE WHERE id = $1`,
    [id]
  );
}