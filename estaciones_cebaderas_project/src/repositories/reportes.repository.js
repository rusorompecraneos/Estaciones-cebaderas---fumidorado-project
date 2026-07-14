// src/repositories/reportes.repository.js
 
import pool from '../config/db.config.js';
 
// ── Visitas finalizadas ───────────────────────────────────────────────────────
 
export async function findVisitasFinalizadas({ clienteId, sedeId } = {}) {
  let where = `WHERE v.estado = 'finalizada'`;
  const params = [];
 
  if (clienteId) {
    params.push(clienteId);
    where += ` AND c.id = $${params.length}`;
  }
  if (sedeId) {
    params.push(sedeId);
    where += ` AND s.id = $${params.length}`;
  }
 
  const { rows } = await pool.query(
    `SELECT
       v.id, v.fecha, v.hora_inicio, v.hora_fin, v.estado, v.os, v.fecha_ejecucion,
       t.nombre   AS tecnico_nombre,
       s.id       AS sede_id,   s.nombre AS sede_nombre,   s.codigo AS sede_codigo,
       c.id       AS cliente_id, c.nombre AS cliente_nombre, c.codigo AS cliente_codigo,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id)                             AS total_estaciones,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo = 'con_consumo') AS con_consumo,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo = 'sin_consumo') AS sin_consumo,
       (SELECT COUNT(*) FROM estaciones e WHERE e.visita_id = v.id AND e.consumo = 'captura')     AS captura
     FROM visitas v
     JOIN tecnicos  t ON t.id = v.tecnico_id
     JOIN sedes     s ON s.id = v.sede_id
     JOIN clientes  c ON c.id = s.cliente_id
     ${where}
     ORDER BY v.fecha DESC, v.hora_inicio DESC`,
    params
  );
  return rows;
}
 
// ── Detalle completo de una visita ────────────────────────────────────────────
 
export async function findVisitaCompleta(visitaId) {
  // Datos de la visita
  const { rows: vRows } = await pool.query(
    `SELECT
       v.id, v.tecnico_id, v.fecha, v.hora_inicio, v.hora_fin, v.estado, v.os, v.fecha_ejecucion,
       t.nombre   AS tecnico_nombre,  t.iniciales AS tecnico_iniciales,
       s.id       AS sede_id,   s.nombre AS sede_nombre,   s.codigo AS sede_codigo,
                                s.direccion AS sede_direccion,
       c.id       AS cliente_id, c.nombre AS cliente_nombre, c.codigo AS cliente_codigo
     FROM visitas v
     JOIN tecnicos  t ON t.id = v.tecnico_id
     JOIN sedes     s ON s.id = v.sede_id
     JOIN clientes  c ON c.id = s.cliente_id
     WHERE v.id = $1 LIMIT 1`,
    [visitaId]
  );
  const visita = vRows[0] || null;
  if (!visita) return null;
 
  // Estaciones
  const { rows: estaciones } = await pool.query(
    `SELECT id, numero, tipo, consumo, repone, novedad, observaciones
     FROM estaciones
     WHERE visita_id = $1
     ORDER BY numero ASC`,
    [visitaId]
  );
 
  // Fotos por estación
  for (const est of estaciones) {
    const { rows: fotos } = await pool.query(
      `SELECT id, filename, original_name
       FROM estacion_fotos
       WHERE estacion_id = $1
       ORDER BY created_at ASC`,
      [est.id]
    );
    est.fotos = fotos;
  }
 
  // Diagrama UPC de la sede
  const { rows: dRows } = await pool.query(
    `SELECT d.id, d.nombre, d.filename
     FROM diagramas_upc d
     WHERE d.sede_id = $1 AND d.activo = TRUE
     LIMIT 1`,
    [visita.sede_id]
  );
  const diagrama = dRows[0] || null;
 
  // Puntos del diagrama
  let puntos = [];
  if (diagrama) {
    const { rows: pRows } = await pool.query(
      `SELECT numero, tipo, x_pct, y_pct, pagina
       FROM diagrama_puntos
       WHERE diagrama_id = $1
       ORDER BY numero ASC`,
      [diagrama.id]
    );
    puntos = pRows;
  }
 
  // Estadísticas
  const stats = {
    total:       estaciones.length,
    con_consumo: estaciones.filter(e => e.consumo === 'con_consumo').length,
    sin_consumo: estaciones.filter(e => e.consumo === 'sin_consumo').length,
    captura:     estaciones.filter(e => e.consumo === 'captura').length,
    pendiente:   estaciones.filter(e => !e.consumo || e.consumo === 'pendiente').length,
  };
 
  return { visita, estaciones, diagrama, puntos, stats };
}