// src/config/db.config.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'estaciones_cebaderas_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Opciones de conexión
  max:              10,   // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,  // ← antes 2000; más tolerante a arranques en frío
});

// ── Evitar que un error en un cliente inactivo tumbe el proceso completo ──────
// pg recomienda explícitamente este listener: sin él, un error de red en una
// conexión ociosa del pool puede lanzar una excepción no capturada y matar Node.
pool.on('error', (err) => {
  console.error('❌  Error inesperado en un cliente inactivo del pool de PostgreSQL:', err.message);
});

// ── Verificar conexión al iniciar, con reintentos ─────────────────────────────
async function verificarConexion(intentos = 5, esperaMs = 3000) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('✅  Conectado a PostgreSQL —', process.env.DB_NAME);
      return;
    } catch (err) {
      console.error(`❌  Intento ${i}/${intentos} — Error conectando a PostgreSQL:`, err.message);
      if (i < intentos) {
        await new Promise((resolve) => setTimeout(resolve, esperaMs));
      } else {
        console.error('❌  No se pudo conectar a PostgreSQL después de varios intentos.');
      }
    }
  }
}

verificarConexion();

export default pool;