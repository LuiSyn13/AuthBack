// controllers/posts.controller.js
const pool = require('../db');
//import pool from '../db.js';

// Lógica para crear un nuevo post
exports.createPost = async (req, res) => {
    const { title, content } = req.body;
    const userId = req.user.id; // El ID del usuario viene del token JWT (gracias al middleware)

    if (!title || !content) {
        return res.status(400).json({ message: 'Título y contenido son requeridos.' });
    }

    try {
        const newPost = await pool.query(
            'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *'
            , [userId, title, content]
        );
        res.status(201).json({
            message: 'Post creado exitosamente.',
            post: newPost.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Lógica para obtener todos los posts
exports.getAllPosts = async (req, res) => {
    try {
        const allPosts = await pool.query('SELECT p.*, u.email as user_email FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
        res.status(200).json(allPosts.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Lógica para obtener los posts del usuario autenticado
exports.getPostsByUser = async (req, res) => {
    const userId = req.user.id; // El ID del usuario viene del token JWT

    try {
        const userPosts = await pool.query('SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.status(200).json(userPosts.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};