// src/controllers/diagramas.controller.js

import * as service from '../services/diagramas.service.js';
import path  from 'path';
import fs    from 'fs';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';
import * as clienteRepo  from '../repositories/tecnico.repository.js';
import * as clientesService from '../services/clientes.service.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── GET /admin/diagramas ──────────────────────────────────────────────────────
export async function showDiagramas(req, res) {
  try {
    const [diagramas, clientes] = await Promise.all([
      service.getAllDiagramas(),
      clienteRepo.findAllClientes(),
    ]);

    // Sedes agrupadas por cliente para el select del formulario
    const sedesPorCliente = {};
    for (const c of clientes) {
      sedesPorCliente[c.id] = await clienteRepo.findSedesByCliente(c.id);
    }

    return res.render('admin/diagramas-upc', {
      title:            'Diagramas UPC — FumiDorado',
      currentUser:      req.session.user,
      diagramas,
      clientes,
      sedesPorCliente,
    });
  } catch (err) {
    console.error('[diagramas.controller] showDiagramas:', err);
    return res.render('admin/diagramas-upc', {
      title:            'Diagramas UPC — FumiDorado',
      currentUser:      req.session.user,
      diagramas:        [],
      clientes:         [],
      sedesPorCliente:  {},
    });
  }
}

// ── POST /admin/diagramas  (subir PDF) ────────────────────────────────────────
export async function subirDiagrama(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se recibió ningún archivo PDF.' });
  }

  const { sedeId, nombre } = req.body;
  if (!sedeId || !nombre?.trim()) {
    // Borrar el archivo subido si faltan datos
    fs.unlinkSync(req.file.path);
    return res.status(422).json({ success: false, message: 'Sede y nombre son requeridos.' });
  }

  try {
    const result = await service.createDiagrama({
      sedeId:    parseInt(sedeId),
      filename:  req.file.filename,
      nombre:    nombre.trim(),
      createdBy: req.session.user.id,
    });

    return res.json({
      success:    true,
      diagramaId: result.id,
      replaced:   result.replaced,
    });
  } catch (err) {
    console.error('[diagramas.controller] subirDiagrama:', err);
    fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Error al guardar el diagrama.' });
  }
}

// ── GET /admin/diagramas/:id/configurar ──────────────────────────────────────
export async function showConfigurar(req, res) {
  try {
    const diagrama = await service.getDiagramaById(req.params.id);
    if (!diagrama) return res.redirect('/admin/diagramas-upc');

    const puntos = await service.getPuntosByDiagrama(diagrama.id);

    return res.render('admin/diagrama-configurar', {
      title:       `Configurar — ${diagrama.nombre}`,
      currentUser: req.session.user,
      diagrama,
      puntos,
      tipos:       service.TIPOS_PUNTO,
    });
  } catch (err) {
    console.error('[diagramas.controller] showConfigurar:', err);
    return res.redirect('/admin/diagramas-upc');
  }
}

// ── POST /admin/diagramas/:id/puntos  (AJAX — guardar puntos) ─────────────────
export async function guardarPuntos(req, res) {
  const { puntos } = req.body;

  if (!Array.isArray(puntos)) {
    return res.status(422).json({ success: false, message: 'Formato de puntos inválido.' });
  }

  try {
    const total = await service.savePuntos(req.params.id, puntos);
    return res.json({ success: true, total });
  } catch (err) {
    console.error('[diagramas.controller] guardarPuntos:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── DELETE /admin/diagramas/:id  (AJAX) ───────────────────────────────────────
export async function eliminarDiagrama(req, res) {
  try {
    const deleted = await service.deleteDiagrama(req.params.id);
    if (deleted) {
      // Borrar PDF del disco
      const filePath = path.join(__dirname, '../../public/uploads/diagramas', deleted.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[diagramas.controller] eliminarDiagrama:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar.' });
  }
}

// ── GET /admin/diagramas/:id/pdf  (servir el PDF al navegador) ────────────────
export async function servePdf(req, res) {
  try {
    const diagrama = await service.getDiagramaById(req.params.id);
    if (!diagrama) return res.status(404).send('Diagrama no encontrado.');

    const filePath = path.join(__dirname, '../../public/uploads/diagramas', diagrama.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('Archivo no encontrado.');

    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).send('Error.');
  }
}

// ── POST /admin/clientes  (AJAX — crear cliente + sedes) ──────────────────────
export async function crearCliente(req, res) {
  try {
    const { codigo, nombre, nit, sedes } = req.body;
    const result = await clientesService.crearClienteConSedes({ codigo, nombre, nit, sedes });
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── POST /admin/sedes  (AJAX — agregar sede a cliente existente) ──────────────
export async function crearSedeAjax(req, res) {
  try {
    const { clienteId, codigo, nombre, direccion } = req.body;
    const sede = await clientesService.crearSede({ clienteId, codigo, nombre, direccion });
    return res.json({ success: true, sede });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}