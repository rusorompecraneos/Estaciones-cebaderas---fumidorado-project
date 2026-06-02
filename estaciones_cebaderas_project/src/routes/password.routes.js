import express from 'express';
import passwordController from '../controllers/password.controller.js';

const router = express.Router();

router.get('/recuperar',       passwordController.mostrarRecuperar);
router.post('/recuperar',      passwordController.enviarCodigo);

router.get('/verificar',       passwordController.mostrarVerificar);
router.post('/verificar',      passwordController.verificarCodigo);
router.post('/reenviar',       passwordController.reenviarCodigo);

router.get('/nueva-password',  passwordController.mostrarNuevaPassword);
router.post('/nueva-password', passwordController.actualizarPassword);

router.get('/confirmacion',    passwordController.mostrarConfirmacion);

export default router;