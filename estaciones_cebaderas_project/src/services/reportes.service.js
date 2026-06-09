// src/services/reportes.service.js
 
import * as repo          from '../repositories/reportes.repository.js';
import * as clienteRepo   from '../repositories/tecnico.repository.js';
 
export async function getVisitasFinalizadas({ clienteId, sedeId } = {}) {
  return repo.findVisitasFinalizadas({ clienteId, sedeId });
}
 
export async function getVisitaCompleta(visitaId) {
  return repo.findVisitaCompleta(visitaId);
}
 
export async function getClientes() {
  return clienteRepo.findAllClientes();
}
 
export async function getSedesByCliente(clienteId) {
  return clienteRepo.findSedesByCliente(clienteId);
}