// src/repositories/diagramas.repository.js

import pool from '../config/db.config.js';

// ── DIAGRAMAS ─────────────────────────────────────────────────────────────────

export async function findAllDiagramas() {
  const { rows } = await pool.query(
    `SELECT d.id, d.nombre, d.filename, d.activo, d.created_at,
            s.nombre AS sede_nombre, s.codigo AS sede_codigo,
            c.nombre AS cliente_nombre, c.codigo AS cliente_codigo,
            c.id     AS cliente_id,    s.id     AS sede_id,
            (SELECT COUNT(*) FROM diagrama_puntos WHERE diagrama_id = d.id) AS total_puntos
     FROM diagramas_upc d
     JOIN sedes    s ON s.id = d.sede_id
     JOIN clientes c ON c.id = s.cliente_id
     ORDER BY c.nombre ASC, s.nombre ASC`
  );
  return rows;
}

export async function findDiagramaById(id) {
  const { rows } = await pool.query(
    `SELECT d.*, s.nombre AS sede_nombre, s.codigo AS sede_codigo,
            c.nombre AS cliente_nombre, c.codigo AS cliente_codigo
     FROM diagramas_upc d
     JOIN sedes    s ON s.id = d.sede_id
     JOIN clientes c ON c.id = s.cliente_id
     WHERE d.id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findDiagramaBySede(sedeId) {
  const { rows } = await pool.query(
    `SELECT d.*, s.nombre AS sede_nombre, s.codigo AS sede_codigo,
            c.nombre AS cliente_nombre, c.codigo AS cliente_codigo
     FROM diagramas_upc d
     JOIN sedes    s ON s.id = d.sede_id
     JOIN clientes c ON c.id = s.cliente_id
     WHERE d.sede_id = $1 AND d.activo = TRUE
     LIMIT 1`,
    [sedeId]
  );
  return rows[0] || null;
}

export async function createDiagrama({ sedeId, filename, nombre, createdBy }) {
  // Si ya existe uno para esa sede, actualizarlo
  const existing = await findDiagramaBySede(sedeId);
  if (existing) {
    const { rows } = await pool.query(
      `UPDATE diagramas_upc
       SET filename = $1, nombre = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id`,
      [filename, nombre, existing.id]
    );
    return { id: rows[0].id, replaced: true };
  }

  const { rows } = await pool.query(
    `INSERT INTO diagramas_upc (sede_id, filename, nombre, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [sedeId, filename, nombre, createdBy]
  );
  return { id: rows[0].id, replaced: false };
}

export async function deleteDiagrama(id) {
  const { rows } = await pool.query(
    `DELETE FROM diagramas_upc WHERE id = $1 RETURNING filename`,
    [id]
  );
  return rows[0] || null;
}

// ── PUNTOS ────────────────────────────────────────────────────────────────────

export async function findPuntosByDiagrama(diagramaId) {
  const { rows } = await pool.query(
    `SELECT id, numero, tipo, x_pct, y_pct
     FROM diagrama_puntos
     WHERE diagrama_id = $1
     ORDER BY numero ASC`,
    [diagramaId]
  );
  return rows;
}

/**
 * Reemplaza todos los puntos de un diagrama en una sola transacción.
 * puntos = [{ numero, tipo, x_pct, y_pct }, ...]
 */
export async function savePuntos(diagramaId, puntos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Borrar puntos anteriores
    await client.query(
      `DELETE FROM diagrama_puntos WHERE diagrama_id = $1`,
      [diagramaId]
    );

    // Insertar nuevos
    for (const p of puntos) {
      await client.query(
        `INSERT INTO diagrama_puntos (diagrama_id, numero, tipo, x_pct, y_pct)
         VALUES ($1, $2, $3, $4, $5)`,
        [diagramaId, p.numero, p.tipo, p.x_pct, p.y_pct]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}