// src/routes/admin.routes.js

import { Router } from 'express';
import { showDashboard }    from '../controllers/admin.controller.js';
import {
  showUsuarios,
  crearAdmin,   editarAdmin,   eliminarAdmin,
  crearTecnico, editarTecnico, eliminarTecnico,
} from '../controllers/usuarios.controller.js';
import { isAuthenticated, requireRole } from '../middlewares/authmiddleware.js';

import { showDiagramas, subirDiagrama, showConfigurar, guardarPuntos, servePdf , eliminarDiagrama, crearCliente, crearSedeAjax } from '../controllers/diagramas.controller.js';

import uploadDiagramas from '../middlewares/uploadDiagramas.js';
import { showReportes, showReporte } from '../controllers/reportes.controller.js';



const router = Router();

// PDF accesible por cualquier usuario autenticado (admin y técnico) 
router.get('/diagramas/:id/pdf', isAuthenticated, servePdf);
// Resto de rutas admin que requieren rol específico
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


router.post(
  '/diagramas-upc',
  uploadDiagramas.single('pdf'),
  subirDiagrama
);

router.get('/diagramas-upc/:id/pdf', servePdf);

router.get('/diagramas-upc/:id/configurar', showConfigurar);

router.post(
  '/diagramas-upc/:id/puntos',
  guardarPuntos
);
router.delete('/diagramas-upc/:id',          eliminarDiagrama);

router.post('/clientes', crearCliente);
router.post('/sedes',    crearSedeAjax);

router.get('/reportes', showReportes);

router.get('/reportes/:visitaId', showReporte);



export default router;

