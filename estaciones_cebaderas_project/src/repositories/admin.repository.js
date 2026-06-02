// src/repositories/admin.repository.js

import pool from '../config/db.config.js';

export async function countTecnicosActivos() {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM tecnicos WHERE activo = TRUE`
  );
  return parseInt(rows[0].total, 10);
}

export async function countAdmins() {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS total FROM administradores WHERE activo = TRUE`
  );
  return parseInt(rows[0].total, 10);
}

export async function countDiagramas() {
  // La tabla diagramas_upc se crea en la iteración de diagramas.
  // Por ahora retornamos 0 de forma segura.
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) AS total FROM diagramas_upc`
    );
    return parseInt(rows[0].total, 10);
  } catch {
    return 0;
  }
}