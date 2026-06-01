// src/config/seed.js
// Ejecutar UNA sola vez: node src/config/seed.js

import bcrypt from 'bcrypt';
import pool from './db.config.js';

const SALT_ROUNDS = 10;

async function seed() {
  console.log('🌱  Iniciando seed...\n');

  try {
    // ── Administradores ──────────────────────────────────────────────────────
    const admins = [
      { username: 'admin',  password: 'Admin123*', nombre: 'Administrador General', email: 'admin@fumiDorado.com' },
      { username: 'jgomez', password: 'Admin123*', nombre: 'Juan Gómez',            email: 'jgomez@fumiDorado.com' },
    ];

    for (const admin of admins) {
      const hash = await bcrypt.hash(admin.password, SALT_ROUNDS);
      await pool.query(
        `INSERT INTO administradores (username, password, nombre, email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO NOTHING`,
        [admin.username, hash, admin.nombre, admin.email]
      );
      console.log(`  ✅  Admin creado:   ${admin.username}  /  ${admin.password}`);
    }

    // ── Técnicos ─────────────────────────────────────────────────────────────
    const tecnicos = [
      { nombre: 'Carlos M. Pérez',   iniciales: 'CP', pin: '1234', email: 'cperez@fumiDorado.com',   telefono: '3001234567' },
      { nombre: 'Andrés F. Ramírez', iniciales: 'AR', pin: '2580', email: 'aramirez@fumiDorado.com', telefono: '3109876543' },
      { nombre: 'Laura V. Torres',   iniciales: 'LT', pin: '3691', email: 'ltorres@fumiDorado.com',  telefono: '3205551234' },
      { nombre: 'Miguel A. Suárez',  iniciales: 'MS', pin: '1470', email: 'msuarez@fumiDorado.com',  telefono: '3156667890' },
    ];

    for (const tec of tecnicos) {
      const pinHash = await bcrypt.hash(tec.pin, SALT_ROUNDS);
      await pool.query(
        `INSERT INTO tecnicos (nombre, iniciales, pin, email, telefono)
         VALUES ($1, $2, $3, $4, $5)`,
        [tec.nombre, tec.iniciales, pinHash, tec.email, tec.telefono]
      );
      console.log(`  ✅  Técnico creado: ${tec.nombre}  /  PIN: ${tec.pin}`);
    }

    console.log('\n🎉  Seed completado exitosamente.');
  } catch (err) {
    console.error('❌  Error en seed:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();