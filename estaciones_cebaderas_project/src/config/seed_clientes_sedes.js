// src/config/seed_clientes_sedes.js
//
// Ejecutar UNA sola vez: node src/config/seed_clientes_sedes.js
//
// Qué hace:
//   1. Elimina los clientes mock (Aerorepublica, Latam Cargo, Avianca MRO)
//      y todo lo relacionado en cascada (sedes, visitas, diagramas_upc).
//   2. Inserta los 16 clientes y 62 sedes reales desde clientes_sedes_seed.json
//
// IMPORTANTE: Antes de correr esto, ejecuta en PgAdmin el archivo
//   src/config/migration_nit.sql
// para agregar la columna `nit` a la tabla `clientes`.

import pool from './db.config.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const seedPath = join(__dirname, 'clientes_sedes_seed.json');
const clientesData = JSON.parse(readFileSync(seedPath, 'utf-8'));

async function run() {
  const client = await pool.connect();

  try {
    console.log('🔍  Verificando datos mock existentes...\n');

    // ── 1. Mostrar qué se va a borrar ──────────────────────────────────────
    const { rows: mockClientes } = await client.query(`SELECT id, codigo, nombre FROM clientes`);
    console.log(`Clientes actuales en DB (${mockClientes.length}):`);
    mockClientes.forEach(c => console.log(`  - [${c.id}] ${c.codigo} — ${c.nombre}`));

    const { rows: visitasCount } = await client.query(`SELECT COUNT(*) AS total FROM visitas`);
    const { rows: diagramasCount } = await client.query(`SELECT COUNT(*) AS total FROM diagramas_upc`);
    console.log(`\nVisitas que se eliminarán en cascada: ${visitasCount[0].total}`);
    console.log(`Diagramas UPC que se eliminarán en cascada: ${diagramasCount[0].total}\n`);

    // ── 2. Confirmar y borrar todo lo existente ────────────────────────────
    console.log('🗑️   Eliminando clientes mock (cascada a sedes, visitas, diagramas)...');
    await client.query('BEGIN');

    await client.query(`DELETE FROM clientes`);  // ON DELETE CASCADE limpia sedes/visitas/diagramas

    console.log('✅  Datos mock eliminados.\n');

    // ── 3. Insertar clientes y sedes reales ────────────────────────────────
    console.log('🌱  Insertando clientes y sedes reales...\n');

    let totalClientes = 0;
    let totalSedes    = 0;

    for (const c of clientesData) {
      const { rows } = await client.query(
        `INSERT INTO clientes (codigo, nit, nombre, activo)
         VALUES ($1, $2, $3, TRUE)
         RETURNING id`,
        [c.codigo, c.nit, c.nombre]
      );
      const clienteId = rows[0].id;
      totalClientes++;

      for (const s of c.sedes) {
        await client.query(
          `INSERT INTO sedes (cliente_id, codigo, nombre, direccion, activo)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [clienteId, s.codigo, s.nombre, s.direccion]
        );
        totalSedes++;
      }

      console.log(`  ✅  ${c.codigo} — ${c.nombre} (${c.sedes.length} sede${c.sedes.length !== 1 ? 's' : ''})`);
    }

    await client.query('COMMIT');

    console.log(`\n🎉  Migración completada.`);
    console.log(`    Clientes insertados: ${totalClientes}`);
    console.log(`    Sedes insertadas:    ${totalSedes}`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Error en la migración, se revirtieron los cambios:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(() => process.exit(1));