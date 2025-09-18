// index.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Importar rutas modularizadas desde la carpeta src
import authRoutes from './src/routes/auth.routes.js';
import postsRoutes from './src/routes/posts.routes.js';
import userRoutes from './src/routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Permite peticiones de otros orígenes
app.use(express.json()); // Permite a Express entender JSON en el body

// Usar rutas modularizadas
app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/', userRoutes); // Rutas de usuario como /profile

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});