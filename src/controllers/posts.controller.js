// controllers/posts.controller.js
import pool from '../db.js';

// Lógica para crear un nuevo post
export const createPost = async (req, res) => {
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
export const getAllPosts = async (req, res) => {
    try {
        const allPosts = await pool.query('SELECT p.*, u.email as user_email FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC');
        res.status(200).json(allPosts.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Lógica para obtener los posts del usuario autenticado
export const getPostsByUser = async (req, res) => {
    const userId = req.user.id; // El ID del usuario viene del token JWT

    try {
        const userPosts = await pool.query('SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.status(200).json(userPosts.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Lógica para actualizar un post
export const updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
        return res.status(400).json({ message: 'Título y contenido son requeridos.' });
    }

    try {
        const updatedPost = await pool.query(
            'UPDATE posts SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *'
            , [title, content, id, userId]
        );

        if (updatedPost.rowCount === 0) {
            return res.status(403).json({ message: 'No tienes permiso para editar este post o el post no existe.' });
        }

        res.json({
            message: 'Post actualizado exitosamente.',
            post: updatedPost.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Lógica para eliminar un post
export const deletePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [id, userId]);

        if (result.rowCount === 0) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este post o el post no existe.' });
        }

        res.status(204).send(); // 204 No Content
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};