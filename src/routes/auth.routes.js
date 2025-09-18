// routes/auth.routes.js
import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// Rutas de autenticación
router.post('/register', authController.register);
router.get('/verify-email', authController.verify_email);
router.post('/login', authController.login);
router.post('/social-login', authController.social_login);

export default router;
