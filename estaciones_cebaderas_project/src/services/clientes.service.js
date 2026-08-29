import * as repo from '../repositories/tecnico.repository.js';

function validarCodigoNombre(codigo, nombre, { maxCodigo, maxNombre, label }) {
  if (!codigo || !codigo.trim()) throw new Error(`El código de ${label} es requerido.`);
  if (codigo.trim().length > maxCodigo) {
    throw new Error(`El código de ${label} no puede superar ${maxCodigo} caracteres.`);
  }
  if (!nombre || !nombre.trim()) throw new Error(`El nombre de ${label} es requerido.`);
  if (nombre.trim().length > maxNombre) {
    throw new Error(`El nombre de ${label} no puede superar ${maxNombre} caracteres.`);
  }
}

// ── Crear cliente con al menos una sede ───────────────────────────────────────
export async function crearClienteConSedes({ codigo, nombre, nit, sedes }) {
  validarCodigoNombre(codigo, nombre, { maxCodigo: 10, maxNombre: 50, label: 'el cliente' });

  if (nit && nit.trim().length > 20) {
    throw new Error('El NIT no puede superar 20 caracteres.');
  }

  if (!Array.isArray(sedes) || sedes.length === 0) {
    throw new Error('Debe agregar al menos una sede.');
  }

  const sedesNormalizadas = sedes.map((s, i) => {
    validarCodigoNombre(s.codigo, s.nombre, { maxCodigo: 10, maxNombre: 150, label: `la sede ${i + 1}` });
    if (s.direccion && s.direccion.trim().length > 225) {
      throw new Error(`La dirección de la sede ${i + 1} no puede superar 225 caracteres.`);
    }
    return {
      codigo:    s.codigo.trim(),
      nombre:    s.nombre.trim(),
      direccion: s.direccion?.trim() || null,
    };
  });

  return repo.createClienteConSedes({
    codigo: codigo.trim(),
    nombre: nombre.trim(),
    nit:    nit?.trim() || null,
    sedes:  sedesNormalizadas,
  });
}

// ── Agregar sede a cliente existente ──────────────────────────────────────────
export async function crearSede({ clienteId, codigo, nombre, direccion }) {
  if (!clienteId) throw new Error('Debe seleccionar un cliente.');
  validarCodigoNombre(codigo, nombre, { maxCodigo: 10, maxNombre: 150, label: 'la sede' });
  if (direccion && direccion.trim().length > 225) {
    throw new Error('La dirección no puede superar 225 caracteres.');
  }

  return repo.createSede({
    clienteId,
    codigo:    codigo.trim(),
    nombre:    nombre.trim(),
    direccion: direccion?.trim() || null,
  });
}