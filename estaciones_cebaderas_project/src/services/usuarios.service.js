// src/services/usuarios.service.js

import bcrypt from 'bcrypt';
import * as repo from '../repositories/usuarios.repository.js';

const SALT_ROUNDS = 10;

// ── Validaciones ──────────────────────────────────────────────────────────────

export function validateAdmin({ nombre, username, email, password }, isEdit = false) {
  const errors = {};

  if (!nombre?.trim())             errors.nombre   = 'El nombre es requerido.';
  if (!username?.trim())           errors.username = 'El usuario es requerido.';
  else if (username.trim().length < 3) errors.username = 'Mínimo 3 caracteres.';
  else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim()))
    errors.username = 'Solo letras, números, puntos y guiones.';

  if (!email?.trim())              errors.email    = 'El correo es requerido.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Correo inválido.';

  if (!isEdit) {
    // Contraseña requerida solo al crear
    if (!password)               errors.password = 'La contraseña es requerida.';
    else if (password.length < 8) errors.password = 'Mínimo 8 caracteres.';
  } else if (password && password.length < 8) {
    errors.password = 'Mínimo 8 caracteres (dejar vacío para no cambiar).';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTecnico({ nombre, iniciales, email, pin }, isEdit = false) {
  const errors = {};

  if (!nombre?.trim())               errors.nombre    = 'El nombre es requerido.';
  if (!iniciales?.trim())            errors.iniciales = 'Las iniciales son requeridas.';
  else if (iniciales.trim().length > 3) errors.iniciales = 'Máximo 3 caracteres.';

  if (email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = 'Correo inválido.';

  if (!isEdit) {
    if (!pin)              errors.pin = 'El PIN es requerido.';
    else if (!/^\d{4}$/.test(pin)) errors.pin = 'El PIN debe ser de 4 dígitos.';
  } else if (pin && !/^\d{4}$/.test(pin)) {
    errors.pin = 'El PIN debe ser de 4 dígitos (dejar vacío para no cambiar).';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ── Admins ────────────────────────────────────────────────────────────────────

export async function getAdmins() {
  return repo.findAllAdmins();
}

export async function createAdmin({ nombre, username, email, password }) {
  // Verificar unicidad
  const existUser  = await repo.findAdminByUsername(username);
  if (existUser)  return { success: false, field: 'username', message: 'Ese usuario ya existe.' };

  const existEmail = await repo.findAdminByEmail(email);
  if (existEmail) return { success: false, field: 'email', message: 'Ese correo ya está registrado.' };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const id = await repo.createAdmin({ username, passwordHash, nombre, email });
  return { success: true, id };
}

export async function updateAdmin({ id, nombre, username, email, password }, currentUserId) {
  const admin = await repo.findAdminById(id);
  if (!admin) return { success: false, message: 'Administrador no encontrado.' };

  // Verificar unicidad de username (excluyendo el mismo)
  const existUser = await repo.findAdminByUsername(username);
  if (existUser && existUser.id !== parseInt(id))
    return { success: false, field: 'username', message: 'Ese usuario ya existe.' };

  const existEmail = await repo.findAdminByEmail(email);
  if (existEmail && existEmail.id !== parseInt(id))
    return { success: false, field: 'email', message: 'Ese correo ya está registrado.' };

  await repo.updateAdmin({ id, nombre, email, username });

  if (password) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await repo.updateAdminPassword({ id, passwordHash });
  }

  return { success: true };
}

export async function deleteAdmin(id, currentUserId) {
  if (parseInt(id) === parseInt(currentUserId)) {
    return { success: false, message: 'No puedes eliminar tu propia cuenta.' };
  }
  const admin = await repo.findAdminById(id);
  if (!admin) return { success: false, message: 'Administrador no encontrado.' };

  await repo.deleteAdmin(id);
  return { success: true };
}

// ── Técnicos ──────────────────────────────────────────────────────────────────

export async function getTecnicos() {
  return repo.findAllTecnicos();
}

export async function createTecnico({ nombre, iniciales, email, telefono, pin }) {
  if (email?.trim()) {
    const existEmail = await repo.findTecnicoByEmail(email);
    if (existEmail) return { success: false, field: 'email', message: 'Ese correo ya está registrado.' };
  }

  const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
  const id = await repo.createTecnico({ nombre, iniciales, pinHash, email, telefono });
  return { success: true, id };
}

export async function updateTecnico({ id, nombre, iniciales, email, telefono, pin }) {
  const tec = await repo.findTecnicoById(id);
  if (!tec) return { success: false, message: 'Técnico no encontrado.' };

  if (email?.trim()) {
    const existEmail = await repo.findTecnicoByEmail(email);
    if (existEmail && existEmail.id !== parseInt(id))
      return { success: false, field: 'email', message: 'Ese correo ya está registrado.' };
  }

  await repo.updateTecnico({ id, nombre, iniciales, email, telefono });

  if (pin) {
    const pinHash = await bcrypt.hash(pin, SALT_ROUNDS);
    await repo.updateTecnicoPin({ id, pinHash });
  }

  return { success: true };
}

export async function deleteTecnico(id) {
  const tec = await repo.findTecnicoById(id);
  if (!tec) return { success: false, message: 'Técnico no encontrado.' };
  await repo.deleteTecnico(id);
  return { success: true };
}