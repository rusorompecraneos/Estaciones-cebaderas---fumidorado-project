/**
 * routes/auth.routes.js
 */

'use strict';

import express from 'express';

import authController from '../controllers/auth.controller.js';
import { guestOnly } from '../middlewares/authmiddleware.js';

const router = express.Router();

// GET /auth/login
router.get('/login', guestOnly, authController.showLogin);

// POST /auth/login
router.post('/login', guestOnly, authController.handleLogin);

// GET /auth/logout
router.get('/logout', authController.handleLogout);

// Alias raíz → login
router.get('/', (req, res) => res.redirect('/auth/login'));

// GET /auth/forgot-password
router.get('/forgot-password', guestOnly, authController.showForgotPassword);

export default router;
