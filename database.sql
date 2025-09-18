-- Habilitar la extensión para generar UUIDs (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Usuarios
-- Almacena la información de los usuarios, incluyendo credenciales y datos de perfiles sociales.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- ID único para cada usuario (PK)
    email VARCHAR(255) UNIQUE NOT NULL, -- Email del usuario, debe ser único
    password VARCHAR(255), -- Contraseña hasheada, puede ser NULL si se registra con Google
    google_id TEXT UNIQUE, -- ID único de Google, para inicio de sesión social
    is_verified BOOLEAN DEFAULT FALSE, -- Estado de verificación del correo electrónico
    verification_token TEXT, -- Token para verificar el correo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Fecha de última actualización
);

-- Tabla de Posts
-- Almacena el contenido de los posts del foro, vinculados a un usuario.
CREATE TABLE posts (
    id SERIAL PRIMARY KEY, -- ID autoincremental para cada post (PK)
    user_id UUID NOT NULL, -- ID del usuario que creó el post (FK)
    title VARCHAR(255) NOT NULL, -- Título del post
    content TEXT NOT NULL, -- Contenido del post
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Fecha de última actualización

    -- Llave foránea para asegurar la integridad referencial con la tabla de usuarios
    CONSTRAINT fk_user
        FOREIGN KEY(user_id) 
        REFERENCES users(id)
        ON DELETE CASCADE -- Si un usuario es eliminado, sus posts también lo serán.
);

-- Trigger para actualizar el campo 'updated_at' en la tabla de usuarios automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar el campo 'updated_at' en la tabla de posts automáticamente
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar el rendimiento de las búsquedas
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
