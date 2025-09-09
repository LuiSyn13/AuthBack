// index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas modularizadas desde la carpeta src
const authRoutes = require('./src/routes/auth.routes');
const postsRoutes = require('./src/routes/posts.routes');

// Importar middleware de autenticación y pool de BD desde la carpeta src
const authenticateToken = require('./src/middleware/auth.middleware');
const pool = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Permite peticiones de otros orígenes
app.use(express.json()); // Permite a Express entender JSON en el body

// Usar rutas modularizadas
// Todas las rutas de autenticación se prefijan con /auth
app.use('/auth', authRoutes);
// Todas las rutas de posts se prefijan con /posts
app.use('/posts', postsRoutes);

// Ruta protegida de ejemplo (mantengo aquí para simplicidad, podría ir en un archivo de rutas de usuario)
app.get('/profile', authenticateToken, async (req, res) => {
    try {
        // La información del usuario (id, email) está en req.user gracias al middleware
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

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});