// src/services/tecnico.service.js

import * as repo from '../repositories/tecnico.repository.js';

// ── Catálogos ────────────────────────────────────────────────────────────────

export const TIPOS_ESTACION = [
  { value: 'quimica',   label: 'Química'   },
  { value: 'mecanica',  label: 'Mecánica'  },
  { value: 'ecologica', label: 'Ecológica' },
];

export const ESTADOS_CONSUMO = [
  { value: 'sin_consumo', label: 'Sin consumo',  color: '#3B9B5C' },
  { value: 'con_consumo', label: 'Con consumo',  color: '#D94F4F' },
  { value: 'captura',     label: 'Hubo captura', color: '#E09B35' },
];

export const NOVEDADES = [
  'Sin novedad',
  'Estación en buen estado',
  'Estación cebadera rota',
  'Estación desplazada',
  'Estación sin cebo',
  'Cebo mojado o deteriorado',
  'Estación bloqueada / obstruida',
  'Estación requiere reposición urgente',
  'Evidencia de actividad de roedores',
  'Otro',
];

// ── Clientes y sedes ──────────────────────────────────────────────────────────

export async function getClientes() {
  return repo.findAllClientes();
}

export async function getSedesByCliente(clienteId) {
  return repo.findSedesByCliente(clienteId);
}

// ── Visitas ───────────────────────────────────────────────────────────────────

export async function iniciarVisita({ tecnicoId, sedeId }) {
  if (!tecnicoId || !sedeId) throw new Error('Técnico y sede son requeridos.');
  const visitaId = await repo.createVisita({ tecnicoId, sedeId });
  return visitaId;
}

export async function getVisitaDetalle(visitaId) {
  const visita     = await repo.findVisitaById(visitaId);
  const estaciones = await repo.findEstacionesByVisita(visitaId);
  return { visita, estaciones };
}

export async function finalizarVisita(visitaId) {
  await repo.finalizarVisita(visitaId);
}

// ── Estaciones ────────────────────────────────────────────────────────────────

export async function agregarEstacion({ visitaId, tipo }) {
  if (!TIPOS_ESTACION.find(t => t.value === tipo)) {
    throw new Error('Tipo de estación inválido.');
  }
  // Obtener el número siguiente
  const estaciones = await repo.findEstacionesByVisita(visitaId);
  const numero     = estaciones.length + 1;
  const id         = await repo.createEstacion({ visitaId, numero, tipo });
  return { id, numero };
}

export async function actualizarEstacion({ id, consumo, repone, novedad, observaciones }) {
  // Validar consumo
  const consumosValidos = ['sin_consumo', 'con_consumo', 'captura', 'pendiente'];
  if (consumo && !consumosValidos.includes(consumo)) {
    throw new Error('Estado de consumo inválido.');
  }
  await repo.updateEstacion({ id, consumo, repone, novedad, observaciones });
}

export async function eliminarEstacion(id) {
  await repo.deleteEstacion(id);
}

// ── Fotos ─────────────────────────────────────────────────────────────────────

export async function guardarFoto({ estacionId, filename, originalName, mimetype, size }) {
  return repo.saveFoto({ estacionId, filename, originalName, mimetype, size });
}

export async function getFotosByEstacion(estacionId) {
  return repo.findFotosByEstacion(estacionId);
}

export async function eliminarFoto(id) {
  return repo.deleteFoto(id);
}