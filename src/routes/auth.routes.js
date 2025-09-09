// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Rutas de autenticación
router.post('/register', authController.register);
router.get('/verify-email', authController.verify_email);
router.post('/login', authController.login);
router.post('/social-login', authController.social_login);

module.exports = router;
