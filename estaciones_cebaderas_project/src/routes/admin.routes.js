// src/routes/admin.routes.js

import { Router } from 'express';
import { showDashboard }    from '../controllers/admin.controller.js';
import {
  showUsuarios,
  crearAdmin,   editarAdmin,   eliminarAdmin,
  crearTecnico, editarTecnico, eliminarTecnico,
} from '../controllers/usuarios.controller.js';
import { isAuthenticated, requireRole } from '../middlewares/authmiddleware.js';

import { showDiagramas, subirDiagrama, showConfigurar } from '../controllers/diagramas.controller.js';

const router = Router();
router.use(isAuthenticated, requireRole('admin'));

// Dashboard
router.get('/dashboard', showDashboard);

// ── Gestión de usuarios ───────────────────────────────────────────────────────
router.get('/usuarios', showUsuarios);

// Admins (AJAX)
router.post('/usuarios/admins',          crearAdmin);
router.put('/usuarios/admins/:id',       editarAdmin);
router.delete('/usuarios/admins/:id',    eliminarAdmin);

// Técnicos (AJAX)
router.post('/usuarios/tecnicos',        crearTecnico);
router.put('/usuarios/tecnicos/:id',     editarTecnico);
router.delete('/usuarios/tecnicos/:id',  eliminarTecnico);

// Placeholder diagramas (próxima entrega)
router.get('/diagramas-upc', showDiagramas);
router.post('/diagramas-upc', subirDiagrama);
router.get('/diagramas-upc/:id', showConfigurar);

export default router;

