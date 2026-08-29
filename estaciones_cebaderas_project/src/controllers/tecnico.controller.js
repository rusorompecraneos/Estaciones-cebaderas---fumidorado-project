// src/controllers/tecnico.controller.js

import * as tecnicoService from '../services/tecnico.service.js';
import { guardarFoto, eliminarFoto } from '../services/tecnico.service.js';
import path  from 'path';
import fs    from 'fs';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── GET /tecnico/mis-visitas──────────────────────────────────────────────────
export async function showMisVisitas(req, res) {
  try {
    const visitas = await tecnicoService.getVisitasByTecnico(req.session.user.id);
    return res.render('tecnico/mis-visitas', {
      title:       'Mis Visitas — FumiDorado',
      currentUser: req.session.user,
      visitas,
    });
  } catch (err) {
    console.error('[tecnico.controller] showMisVisitas:', err);
    return res.render('tecnico/mis-visitas', {
      title:       'Mis Visitas — FumiDorado',
      currentUser: req.session.user,
      visitas:     [],
    });
  }
}

// ── GET /tecnico/dashboard ────────────────────────────────────────────────────
export async function showDashboard(req, res) {
  try {
    const clientes = await tecnicoService.getClientes();
    return res.render('tecnico/dashboard', {
      title:       'Dashboard Técnico — FumiDorado',
      currentUser: req.session.user,
      clientes,
    });
  } catch (err) {
    console.error('[tecnico.controller] showDashboard:', err);
    return res.render('tecnico/dashboard', {
      title:       'Dashboard Técnico — FumiDorado',
      currentUser: req.session.user,
      clientes:    [],
    });
  }
}

// ── GET /tecnico/sedes/:clienteId  (AJAX) ─────────────────────────────────────
export async function getSedesAjax(req, res) {
  try {
    const sedes = await tecnicoService.getSedesByCliente(req.params.clienteId);
    return res.json({ success: true, sedes });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error cargando sedes.' });
  }
}

// ── POST /tecnico/visita/iniciar ──────────────────────────────────────────────
export async function iniciarVisita(req, res) {
  const { sedeId } = req.body;
  const tecnicoId  = req.session.user.id;

  if (!sedeId) {
    const clientes = await tecnicoService.getClientes();
    return res.status(422).render('tecnico/dashboard', {
      title:       'Dashboard Técnico — FumiDorado',
      currentUser: req.session.user,
      clientes,
      error:       'Seleccione una sede para continuar.',
    });
  }

  try {
    const { visitaId } = await tecnicoService.iniciarVisita({ tecnicoId, sedeId });
    return res.redirect(`/tecnico/visita/${visitaId}`);
  } catch (err) {
    console.error('[tecnico.controller] iniciarVisita:', err);
    return res.redirect('/tecnico/dashboard');
  }
}

// ── GET /tecnico/visita/:visitaId ─────────────────────────────────────────────
export async function showVisita(req, res) {
  try {
    const { visita, estaciones, diagrama, puntos } =
      await tecnicoService.getVisitaDetalle(req.params.visitaId);

    if (!visita) return res.redirect('/tecnico/dashboard');
    if (visita.tecnico_id !== req.session.user.id) return res.redirect('/tecnico/dashboard');

    return res.render('tecnico/visita', {
      title:       `Visita — ${visita.sede_nombre}`,
      currentUser: req.session.user,
      visita,
      estaciones,
      diagrama,      // puede ser null si no hay diagrama
      puntos,        // puntos del diagrama para el mapa
      tipos:         tecnicoService.TIPOS_ESTACION,
      consumos:      tecnicoService.ESTADOS_CONSUMO,
      novedades:     tecnicoService.NOVEDADES,
      tieneDiagrama: !!diagrama,
    });
  } catch (err) {
    console.error('[tecnico.controller] showVisita:', err);
    return res.redirect('/tecnico/dashboard');
  }
}

// ── POST /tecnico/visita/:visitaId/estacion  (AJAX) ───────────────────────────
export async function agregarEstacion(req, res) {
  const { tipo } = req.body;
  try {
    const result = await tecnicoService.agregarEstacion({
      visitaId: req.params.visitaId,
      tipo,
    });
    return res.json({ success: true, estacion: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── PATCH /tecnico/estacion/:id  (AJAX) ───────────────────────────────────────
export async function actualizarEstacion(req, res) {
  const { consumo, repone, novedad, observaciones } = req.body;
  try {
    await tecnicoService.actualizarEstacion({
      id: req.params.id,
      consumo,
      repone: repone === undefined ? null : repone === 'true',
      novedad,
      observaciones,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── DELETE /tecnico/estacion/:id  (AJAX) ──────────────────────────────────────
export async function eliminarEstacion(req, res) {
  try {
    await tecnicoService.eliminarEstacion(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /tecnico/estacion/:id/foto  (AJAX) ───────────────────────────────────
export async function subirFoto(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No se recibió ninguna foto.' });

    const os      = req.visitaOS;                       // inyectado por requireOS
    const relPath = `${os}/${req.file.filename}`;       // lo que guardamos en BD
    const url     = `/fotos-servicio/${relPath}`;       // URL pública protegida

    const fotoId = await guardarFoto({
      estacionId:   req.params.id,
      filename:     relPath,                            // "OS/est-xxxxx.jpg"
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
    });

    return res.json({ success: true, fotoId, filename: relPath, url });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── DELETE /tecnico/foto/:id  (AJAX) ──────────────────────────────────────────
export async function borrarFoto(req, res) {
  try {
    const foto = await eliminarFoto(req.params.id);
    if (foto) {
      // foto.filename ya contiene "OS/est-xxxxx.jpg"
      const filePath = path.join(process.env.FOTOS_BASE_PATH, foto.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── POST /tecnico/visita/:visitaId/finalizar  (AJAX) ──────────────────────────
export async function finalizarVisita(req, res) {
  try {
    await tecnicoService.finalizarVisita(req.params.visitaId);
    return res.json({ success: true, redirect: '/tecnico/dashboard' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ── PATCH /tecnico/visita/:visitaId/os  (AJAX) ────────────────────────────────
export async function actualizarOS(req, res) {
  try {
    await tecnicoService.actualizarOS({
      id: req.params.visitaId,
      os: req.body.os,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── PATCH /tecnico/visita/:visitaId/fecha-ejecucion  (AJAX) ──────────────────
export async function actualizarFechaEjecucion(req, res) {
  try {
    await tecnicoService.actualizarFechaEjecucion({
      id: req.params.visitaId,
      fechaEjecucion: req.body.fechaEjecucion,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── PATCH /tecnico/visita/:visitaId/hora-inicio  (AJAX) ───────────────────────
export async function actualizarHoraInicio(req, res) {
  try {
    await tecnicoService.actualizarHoraInicio({
      id: req.params.visitaId,
      horaInicio: req.body.horaInicio,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── PATCH /tecnico/visita/:visitaId/hora-fin  (AJAX) ───────────────────────────
export async function actualizarHoraFin(req, res) {
  try {
    await tecnicoService.actualizarHoraFin({
      id: req.params.visitaId,
      horaFin: req.body.horaFin,
    });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── GET /tecnico/visita/:visitaId/mapa ────────────────────────────────────────
export async function showMapa(req, res) {
  try {
    const { visita, estaciones, diagrama, puntos } =
      await tecnicoService.getVisitaDetalle(req.params.visitaId);

    if (!visita) return res.redirect('/tecnico/dashboard');

    if (visita.tecnico_id !== req.session.user.id) {
      return res.redirect('/tecnico/dashboard');
    }

    return res.render('tecnico/mapa', {
      title: `Mapa UPC — ${visita.sede_nombre}`,
      currentUser: req.session.user,
      visita,
      estaciones,
      diagrama,
      puntos,
    });
  } catch (err) {
    console.error('[tecnico.controller] showMapa:', err);
    return res.redirect(`/tecnico/visita/${req.params.visitaId}`);
  }
}