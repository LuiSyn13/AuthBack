// routes/posts.routes.js
import express from 'express';
import * as postsController from '../controllers/posts.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// Ruta para crear un nuevo post (protegida)
router.post('/', authenticateToken, postsController.createPost);

// Ruta para obtener todos los posts (protegida)
router.get('/', authenticateToken, postsController.getAllPosts);

// Ruta para obtener los posts del usuario autenticado (protegida)
router.get('/me', authenticateToken, postsController.getPostsByUser);

// Ruta para actualizar un post (protegida)
router.put('/:id', authenticateToken, postsController.updatePost);

// Ruta para eliminar un post (protegida)
router.delete('/:id', authenticateToken, postsController.deletePost);

export default router;
