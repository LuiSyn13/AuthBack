// routes/user.routes.js
import express from 'express';
import authenticateToken from '../middleware/auth.middleware.js';
import pool from '../db.js';
import { deleteAccount } from '../controllers/auth.controller.js';

const router = express.Router();

// Ruta para obtener el perfil del usuario
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userProfile = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.id]);

        if (userProfile.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json(userProfile.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Ruta para eliminar la cuenta del usuario
router.delete('/profile', authenticateToken, deleteAccount);

export default router;