// src/services/diagramas.service.js

import * as repo from '../repositories/diagramas.repository.js';

export const TIPOS_PUNTO = [
  { value: 'quimica',   label: 'Cebadera Química',   icon: '🟡' },
  { value: 'mecanica',  label: 'Cebadera Mecánica',  icon: '⚙️'  },
  { value: 'ecologica', label: 'Cebadera Ecológica', icon: '🌿' },
];

// ── Diagramas ─────────────────────────────────────────────────────────────────

export async function getAllDiagramas() {
  return repo.findAllDiagramas();
}

export async function getDiagramaById(id) {
  return repo.findDiagramaById(id);
}

export async function getDiagramaBySede(sedeId) {
  return repo.findDiagramaBySede(sedeId);
}

export async function createDiagrama({ sedeId, filename, nombre, createdBy }) {
  if (!sedeId || !filename || !nombre) {
    throw new Error('Sede, archivo y nombre son requeridos.');
  }
  return repo.createDiagrama({ sedeId, filename, nombre, createdBy });
}

export async function deleteDiagrama(id) {
  return repo.deleteDiagrama(id);
}

// ── Puntos ────────────────────────────────────────────────────────────────────

export async function getPuntosByDiagrama(diagramaId) {
  return repo.findPuntosByDiagrama(diagramaId);
}

/**
 * Guarda la configuración completa de puntos de un diagrama.
 * Valida y normaliza antes de persistir.
 */
export async function savePuntos(diagramaId, puntos) {
  if (!Array.isArray(puntos) || puntos.length === 0) {
    throw new Error('Debe haber al menos un punto.');
  }

  const tiposValidos = TIPOS_PUNTO.map(t => t.value);
  const normalized = puntos.map((p, i) => {
    if (!tiposValidos.includes(p.tipo)) throw new Error(`Tipo inválido en punto ${i + 1}.`);
    const x = parseFloat(p.x_pct);
    const y = parseFloat(p.y_pct);
    if (isNaN(x) || isNaN(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      throw new Error(`Coordenadas inválidas en punto ${i + 1}.`);
    }
    return { numero: i + 1, tipo: p.tipo, x_pct: x, y_pct: y };
  });

  await repo.savePuntos(diagramaId, normalized);
  return normalized.length;
}

// ── Integración con visitas ───────────────────────────────────────────────────

/**
 * Dado un sedeId, retorna los puntos del diagrama UPC activo.
 * El controlador de técnico llama esto al iniciar una visita
 * para pre-crear las estaciones.
 */
export async function getPuntosParaVisita(sedeId) {
  const diagrama = await repo.findDiagramaBySede(sedeId);
  if (!diagrama) return { diagrama: null, puntos: [] };

  const puntos = await repo.findPuntosByDiagrama(diagrama.id);
  return { diagrama, puntos };
}