// routes/posts.routes.js
const express = require('express');
const router = express.Router();
const postsController = require('../controllers/posts.controller');
const authenticateToken = require('../middleware/auth.middleware');

// Ruta para crear un nuevo post (protegida)
router.post('/', authenticateToken, postsController.createPost);

// Ruta para obtener todos los posts (protegida)
router.get('/', authenticateToken, postsController.getAllPosts);

// Ruta para obtener los posts del usuario autenticado (protegida)
router.get('/me', authenticateToken, postsController.getPostsByUser);

module.exports = router;