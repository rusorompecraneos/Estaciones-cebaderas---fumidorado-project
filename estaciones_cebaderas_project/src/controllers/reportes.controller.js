// src/controllers/reportes.controller.js

import * as service from '../services/reportes.service.js';

// ── GET /admin/reportes ───────────────────────────────────────────────────────
export async function showReportes(req, res) {
  try {
    const { clienteId, sedeId } = req.query;

    const [visitas, clientes] = await Promise.all([
      service.getVisitasFinalizadas({
        clienteId: clienteId ? parseInt(clienteId) : null,
        sedeId:    sedeId    ? parseInt(sedeId)    : null,
      }),
      service.getClientes(),
    ]);

    // Cargar sedes del cliente seleccionado para el filtro
    let sedes = [];
    if (clienteId) {
      sedes = await service.getSedesByCliente(parseInt(clienteId));
    }

    return res.render('admin/reportes', {
      title:       'Reportes y Consumo — FumiDorado',
      currentUser: req.session.user,
      visitas,
      clientes,
      sedes,
      filtros: { clienteId: clienteId || '', sedeId: sedeId || '' },
    });
  } catch (err) {
    console.error('[reportes.controller] showReportes:', err);
    return res.render('admin/reportes', {
      title:       'Reportes y Consumo — FumiDorado',
      currentUser: req.session.user,
      visitas:     [],
      clientes:    [],
      sedes:       [],
      filtros:     { clienteId: '', sedeId: '' },
    });
  }
}

// ── GET /admin/reportes/:visitaId  y  GET /tecnico/visita/:visitaId/reporte ───
// Misma vista, accesible desde ambos roles
export async function showReporte(req, res) {
  try {
    const result = await service.getVisitaCompleta(req.params.visitaId);

    if (!result) {
      const back = req.session.user?.role === 'admin'
        ? '/admin/reportes'
        : '/tecnico/dashboard';
      return res.redirect(back);
    }

    // El técnico solo puede ver sus propias visitas
    if (req.session.user?.role === 'tecnico') {

        console.log('Tecnico visita:', result.visita.tecnico_id);
        console.log('Tecnico sesión:', req.session.user.id);
      if (result.visita.tecnico_id !== req.session.user.id) {
        return res.redirect('/tecnico/dashboard');
      }
    }

    const backUrl = req.session.user?.role === 'admin'
      ? '/admin/reportes'
      : `/tecnico/visita/${req.params.visitaId}/mapa`;

    return res.render('tecnico/reporte', {
      title:       `Reporte — ${result.visita.sede_nombre}`,
      currentUser: req.session.user,
      backUrl,
      ...result,
    });
  } catch (err) {
    console.error('[reportes.controller] showReporte:', err);
    return res.redirect('/');
  }
}