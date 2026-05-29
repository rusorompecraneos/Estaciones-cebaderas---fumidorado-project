/**
 * routes/auth.routes.js
 */

'use strict';

import express from 'express';

import authController from '../controllers/auth.controller.js';
import { guestOnly } from '../middlewares/authmiddleware.js';

const router = express.Router();

// Selector de rol
router.get('/role-select',  guestOnly, authController.showRoleSelect);
 
// Admin login
router.get('/login',  guestOnly, authController.showLogin);
router.post('/login', guestOnly, authController.handleLogin);
 
// Técnico
router.get('/tecnico',        guestOnly, authController.showTecnicoAccess);
router.post('/tecnico/verify',           authController.verifyTecnicoPin);  // AJAX — sin guestOnly para evitar race conditions
 
// Logout
router.get('/logout', authController.handleLogout);
 
// Recuperación de contraseña (próxima iteración)
router.get('/forgot-password', guestOnly, authController.showForgotPassword);
 
// Raíz → role select
router.get('/', (req, res) => res.redirect('/auth/role-select'));

 
export default router;
