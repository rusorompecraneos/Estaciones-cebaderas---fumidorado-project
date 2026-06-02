// src/services/admin.service.js

import * as adminRepo from '../repositories/admin.repository.js';

/**
 * Obtiene las estadísticas rápidas para el dashboard.
 */
export async function getDashboardStats() {
  const [tecnicosActivos, admins, diagramas] = await Promise.all([
    adminRepo.countTecnicosActivos(),
    adminRepo.countAdmins(),
    adminRepo.countDiagramas(),
  ]);

  return { tecnicosActivos, admins, diagramas };
}