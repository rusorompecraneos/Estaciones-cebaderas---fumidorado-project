// src/routes/admin.routes.js

import { Router } from 'express';
import { showDashboard } from '../controllers/admin.controller.js';
import { isAuthenticated, requireRole } from '../middlewares/authmiddleware.js';

const router = Router();

// Todos los endpoints de admin requieren sesión activa y rol 'admin'
router.use(isAuthenticated, requireRole('admin'));

// Dashboard
router.get('/dashboard', showDashboard);


// Placeholders — se implementan en próximas iteraciones
router.get('/usuarios',  (req, res) => res.redirect('/admin/dashboard'));
router.get('/diagramas', (req, res) => res.redirect('/admin/dashboard'));

export default router;