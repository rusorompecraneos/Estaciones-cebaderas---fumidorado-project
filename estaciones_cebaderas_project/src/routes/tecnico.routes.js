// src/routes/tecnico.routes.js

import { Router }    from 'express';
import multer        from 'multer';
import path          from 'path';
import { fileURLToPath } from 'url';
import { dirname }   from 'path';
import { isAuthenticated, requireRole } from '../middlewares/authmiddleware.js';
import {
  showDashboard,
  getSedesAjax,
  iniciarVisita,
  showVisita,
  agregarEstacion,
  actualizarEstacion,
  eliminarEstacion,
  subirFoto,
  borrarFoto,
  finalizarVisita,
  showMapa,
} from '../controllers/tecnico.controller.js';

import { servePdf } from '../controllers/diagramas.controller.js';
import { showReporte } from '../controllers/reportes.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Multer — subida de fotos ──────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/estaciones'));
  },
  filename: (req, file, cb) => {
    const ext    = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `est-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por foto
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

// Todos los endpoints requieren sesión de técnico
router.use(isAuthenticated, requireRole('tecnico'));

// ── Dashboard (selector cliente/sede) ────────────────────────────────────────
router.get('/dashboard',              showDashboard);

// ── AJAX: sedes por cliente ───────────────────────────────────────────────────
router.get('/sedes/:clienteId',       getSedesAjax);

// ── Iniciar visita ────────────────────────────────────────────────────────────
router.post('/visita/iniciar',        iniciarVisita);

// ── Vista de visita (lista de estaciones) ─────────────────────────────────────
router.get('/visita/:visitaId',       showVisita);

// ── Finalizar visita ──────────────────────────────────────────────────────────
router.post('/visita/:visitaId/finalizar', finalizarVisita);

// ── Estaciones (AJAX) ─────────────────────────────────────────────────────────
router.post('/visita/:visitaId/estacion', agregarEstacion);
router.patch('/estacion/:id',             actualizarEstacion);
router.delete('/estacion/:id',            eliminarEstacion);

// ── Fotos (AJAX) ──────────────────────────────────────────────────────────────
router.post('/estacion/:id/foto',  upload.single('foto'), subirFoto);
router.delete('/foto/:id',                                 borrarFoto);

// ── Mapa ──────────────────────────────────────────────────────────────────────
router.get('/visita/:visitaId/mapa',                      showMapa);

router.get(
  '/diagramas-upc/:id/pdf',
  servePdf
);

router.get('/visita/:visitaId/reporte', showReporte);


export default router;