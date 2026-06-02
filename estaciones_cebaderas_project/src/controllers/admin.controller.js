// src/controllers/admin.controller.js

import * as adminService from '../services/admin.service.js';

// ── GET /admin/dashboard ──────────────────────────────────────────────────────
export async function showDashboard(req, res) {
  try {
    const stats = await adminService.getDashboardStats();

    return res.render('admin/dashboard', {
      title:       'Dashboard — FumiDorado',
      currentUser: req.session.user,
      stats,
    });
  } catch (err) {
    console.error('[admin.controller] showDashboard error:', err);
    return res.status(500).render('admin/dashboard', {
      title:       'Dashboard — FumiDorado',
      currentUser: req.session.user,
      stats: { tecnicosActivos: 0, admins: 0, diagramas: 0 },
    });
  }
}