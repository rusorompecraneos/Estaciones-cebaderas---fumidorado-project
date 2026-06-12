// src/repositories/tecnico.repository.js

import pool from '../config/db.config.js';

// ── CLIENTES Y SEDES ─────────────────────────────────────────────────────────

export async function findAllClientes() {
  const { rows } = await pool.query(
    `SELECT id, codigo, nombre
     FROM clientes
     WHERE activo = TRUE
     ORDER BY nombre ASC`
  );
  return rows;
}

export async function findSedesByCliente(clienteId) {
  const { rows } = await pool.query(
    `SELECT id, codigo, nombre, direccion
     FROM sedes
     WHERE cliente_id = $1 AND activo = TRUE
     ORDER BY nombre ASC`,
    [clienteId]
  );
  return rows;
}

export async function findClienteById(id) {
  const { rows } = await pool.query(
    `SELECT id, codigo, nombre FROM clientes WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function findSedeById(id) {
  const { rows } = await pool.query(
    `SELECT s.id, s.codigo, s.nombre, s.direccion, c.nombre AS cliente_nombre, c.codigo AS cliente_codigo
     FROM sedes s
     JOIN clientes c ON c.id = s.cliente_id
     WHERE s.id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

// ── VISITAS ──────────────────────────────────────────────────────────────────

export async function createVisita({ tecnicoId, sedeId }) {
  const { rows } = await pool.query(
    `INSERT INTO visitas (tecnico_id, sede_id)
     VALUES ($1, $2)
     RETURNING id`,
    [tecnicoId, sedeId]
  );
  return rows[0].id;
}

export async function findVisitaById(id) {
  const { rows } = await pool.query(
    `SELECT v.*, s.nombre AS sede_nombre, s.codigo AS sede_codigo,
            c.nombre AS cliente_nombre, c.codigo AS cliente_codigo,
            t.nombre AS tecnico_nombre
     FROM visitas v
     JOIN sedes s    ON s.id = v.sede_id
     JOIN clientes c ON c.id = s.cliente_id
     JOIN tecnicos t ON t.id = v.tecnico_id
     WHERE v.id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function finalizarVisita(visitaId) {
  await pool.query(
    `UPDATE visitas
     SET estado = 'finalizada', hora_fin = CURRENT_TIME
     WHERE id = $1`,
    [visitaId]
  );
}

// ── ESTACIONES ───────────────────────────────────────────────────────────────

export async function findEstacionesByVisita(visitaId) {
  const { rows } = await pool.query(
    `SELECT id, numero, tipo, consumo, repone, novedad, observaciones
     FROM estaciones
     WHERE visita_id = $1
     ORDER BY numero ASC`,
    [visitaId]
  );
  
  return rows;
}

export async function createEstacion({ visitaId, numero, tipo }) {
  const { rows } = await pool.query(
    `INSERT INTO estaciones (visita_id, numero, tipo)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [visitaId, numero, tipo]
  );
  return rows[0].id;
}

export async function updateEstacion({ id, consumo, repone, novedad, observaciones }) {
  await pool.query(
    `UPDATE estaciones
     SET consumo = $1, repone = $2, novedad = $3, observaciones = $4
     WHERE id = $5`,
    [consumo, repone, novedad, observaciones, id]
  );
}

export async function deleteEstacion(id) {
  await pool.query(`DELETE FROM estaciones WHERE id = $1`, [id]);
}

// ── FOTOS ────────────────────────────────────────────────────────────────────

export async function saveFoto({ estacionId, filename, originalName, mimetype, size }) {
  const { rows } = await pool.query(
    `INSERT INTO estacion_fotos (estacion_id, filename, original_name, mimetype, size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [estacionId, filename, originalName, mimetype, size]
  );
  return rows[0].id;
}

export async function findFotosByEstacion(estacionId) {
  const { rows } = await pool.query(
    `SELECT id, filename, original_name FROM estacion_fotos
     WHERE estacion_id = $1
     ORDER BY created_at ASC`,
    [estacionId]
  );
  return rows;
}

export async function deleteFoto(id) {
  const { rows } = await pool.query(
    `DELETE FROM estacion_fotos WHERE id = $1 RETURNING filename`,
    [id]
  );
  return rows[0] || null;
}

// ── Historial de visitas del técnico ─────────────────────────────────────────

export async function findVisitasByTecnico(tecnicoId) {
  const { rows } = await pool.query(
    `SELECT
       v.id, v.fecha, v.hora_inicio, v.hora_fin, v.estado,
       s.id AS sede_id, s.nombre AS sede_nombre, s.codigo AS sede_codigo,
       c.id AS cliente_id, c.nombre AS cliente_nombre, c.codigo AS cliente_codigo,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id) AS total_estaciones,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo != 'pendiente' AND e.consumo IS NOT NULL) AS revisadas,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo = 'con_consumo') AS con_consumo,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo = 'sin_consumo') AS sin_consumo,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo = 'captura')     AS captura
     FROM visitas v
     JOIN sedes     s ON s.id = v.sede_id
     JOIN clientes  c ON c.id = s.cliente_id
     WHERE v.tecnico_id = $1
     ORDER BY v.fecha DESC, v.hora_inicio DESC`,
    [tecnicoId]
  );
  return rows;
}