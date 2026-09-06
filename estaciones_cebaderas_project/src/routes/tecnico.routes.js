// src/routes/tecnico.routes.js

import { Router }    from 'express';
import multer        from 'multer';
import path          from 'path';
import { fileURLToPath } from 'url';
import { dirname }   from 'path';
import fs            from 'fs';
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
  showMisVisitas,
  actualizarOS, 
  actualizarFechaEjecucion,
  actualizarHoraInicio,
  actualizarHoraFin
} from '../controllers/tecnico.controller.js';

import { servePdf } from '../controllers/diagramas.controller.js';
import { showReporte } from '../controllers/reportes.controller.js';
import * as tecnicoService from '../services/tecnico.service.js'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── Multer — subida de fotos ──────────────────────────────────────────────────
const FOTOS_BASE = process.env.FOTOS_BASE_PATH;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // req.visitaOS es inyectado por el middleware requireOS que corre antes
    const dir = path.join(FOTOS_BASE, req.visitaOS);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
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

// ── Middleware: valida OS y lo adjunta al request antes de multer ─────────────
async function requireOS(req, res, next) {
  try {
    const os = await tecnicoService.getOSByEstacionId(req.params.id);
    if (!os) {
      return res.status(400).json({
        success: false,
        message: 'Debes ingresar el número de OS antes de subir fotos.',
      });
    }
    req.visitaOS = os;
    next();
  } catch (err) {
    console.error('[requireOS]', err);
    return res.status(500).json({ success: false, message: 'Error verificando OS.' });
  }
}

const router = Router();

// Todos los endpoints requieren sesión de técnico
router.use(isAuthenticated, requireRole('tecnico'));

// ── Dashboard (selector cliente/sede) ────────────────────────────────────────
router.get('/dashboard',              showDashboard);

router.get('/mis-visitas',              showMisVisitas);        // ← nueva

// ── AJAX: sedes por cliente ───────────────────────────────────────────────────
router.get('/sedes/:clienteId',       getSedesAjax);

// ── Iniciar visita ────────────────────────────────────────────────────────────
router.post('/visita/iniciar',        iniciarVisita);

// ── Vista de visita (lista de estaciones) ─────────────────────────────────────
router.get('/visita/:visitaId',       showVisita);

// ── Finalizar visita ──────────────────────────────────────────────────────────
router.post('/visita/:visitaId/finalizar', finalizarVisita);
router.patch('/visita/:visitaId/os', actualizarOS);
router.patch('/visita/:visitaId/fecha-ejecucion', actualizarFechaEjecucion);
router.patch('/visita/:visitaId/hora-inicio', actualizarHoraInicio);
router.patch('/visita/:visitaId/hora-fin', actualizarHoraFin);

// ── Estaciones (AJAX) ─────────────────────────────────────────────────────────
router.post('/visita/:visitaId/estacion', agregarEstacion);
router.patch('/estacion/:id',             actualizarEstacion);
router.delete('/estacion/:id',            eliminarEstacion);

// ── Fotos (AJAX) ──────────────────────────────────────────────────────────────
router.post('/estacion/:id/foto', requireOS, upload.array('fotos', 10), subirFoto);
router.delete('/foto/:id',                                 borrarFoto);

// ── Mapa ──────────────────────────────────────────────────────────────────────
router.get('/visita/:visitaId/mapa',                      showMapa);

router.get(
  '/diagramas-upc/:id/pdf',
  servePdf
);

router.get('/visita/:visitaId/reporte', showReporte);


export default router;