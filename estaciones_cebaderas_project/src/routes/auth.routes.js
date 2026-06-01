// src/routes/auth.routes.js

import { Router } from 'express';
import {
  showRoleSelect,
  showLogin,
  handleLogin,
  showTecnicoAccess,
  verifyTecnicoPin,
  handleLogout,
  showForgotPassword,
} from '../controllers/auth.controller.js';
import { guestOnly } from '../middlewares/authmiddleware.js';

const router = Router();

// ── Selector de rol ───────────────────────────────────────────────────────────
router.get('/role-select', guestOnly, showRoleSelect);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/login',  guestOnly, showLogin);
router.post('/login', guestOnly, handleLogin);

// ── Técnico ───────────────────────────────────────────────────────────────────
router.get('/tecnico',         guestOnly, showTecnicoAccess);
router.post('/tecnico/verify',            verifyTecnicoPin);   // AJAX

// ── Sesión ────────────────────────────────────────────────────────────────────
router.get('/logout', handleLogout);

// ── Recuperación (próxima iteración) ──────────────────────────────────────────
router.get('/forgot-password', guestOnly, showForgotPassword);

// ── Raíz ─────────────────────────────────────────────────────────────────────
router.get('/', (req, res) => res.redirect('/auth/role'));

export default router;