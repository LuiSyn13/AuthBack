// controllers/auth.controller.js
import { OAuth2Client } from 'google-auth-library';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import 'dotenv/config';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// Lógica para registrar un nuevo usuario
export const register = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        const existingUserResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            return res.status(409).json({ message: 'Este correo electrónico ya está registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(20).toString('hex');

        const newUser = await pool.query(
            'INSERT INTO users (email, password, is_verified, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, email',
            [email, hashedPassword, false, verificationToken]
        );

        const verificationLink = `${process.env.PUBLIC_URL}/auth/verify-email?token=${verificationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirma tu cuenta',
            html: `¡Hola!<br><br>Por favor, confirma tu dirección de correo haciendo clic en este enlace: <a href="${verificationLink}">${verificationLink}</a>`
        };

        await transport.sendMail(mailOptions);

        res.status(201).json({
            message: 'Usuario registrado exitosamente. Por favor, revisa tu correo para confirmar la cuenta.',
            user: newUser.rows[0],
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Nueva ruta para verificar el Email
export const verify_email = async (req, res) => {
    const { token } = req.query;
    if(!token) {
        return res.status(400).send('Token de verificacion no proporcionado.');
    }

    try {
        const result = await pool.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 AND is_verified = FALSE RETURNING id, email',
            [token]
        );

        if (result.rowCount === 0) {
            return res.status(400).send('Token de verificación inválido o ya usado.');
        }

        res.status(200).send('¡Correo electrónico verificado exitosamente! Ya puedes iniciar sesión en la aplicación.');

    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor.');
    }
}

// Lógica para iniciar sesión
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // **NUEVA VERIFICACIÓN:** Si la cuenta no tiene contraseña, es una cuenta de Google
        if (user.password === null) {
            return res.status(401).json({ message: 'Esta cuenta fue registrada con Google. Por favor, inicia sesión con Google.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (!user.is_verified) {
            return res.status(401).json({ message: 'Tu cuenta no ha sido verificada. Por favor, revisa tu correo.' });
        }

        const payload = {
            user: {
                id: user.id,
                email: user.email
            },
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // El token expira en 1 hora
        );

        res.json({
            message: 'Login exitoso.',
            token: token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// Lógica para login con redes sociales (ejemplo con Google)
export const social_login = async (req, res) => {
    const { provider, token } = req.body;

    if (!provider || !token) {
        return res.status(400).json({ message: 'Proveedor y token son requeridos.' });
    }
    try {
        if (provider === 'google') {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const { sub: googleId, email} = payload;

            if (!email) {
                return res.status(400).json({ message: 'No se pudo obtener el email del token de Google.'});
            }

            let userResult = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
            let user = userResult.rows[0];

            if (!user) {
                userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
                user = userResult.rows[0];
            }

            if (user) {
                if (!user.google_id) {
                    await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
                }
            } else {
                const newUser = await pool.query(
                    'INSERT INTO users (email, google_id, is_verified) VALUES ($1, $2, $3) RETURNING id, email, google_id',
                    [email, googleId, true]
                );
                user = newUser.rows[0];
            }
            
            const payload_app = {
                user: {
                    id: user.id,
                    email: user.email,
                    google_id: user.google_id
                },
            };

            const appToken = jwt.sign(
                payload_app,
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                message: 'Login con Google exitoso.',
                token: appToken
            });
        } else {
            return res.status(400).json({ message: 'Proveedor de login social no soportado.' });
        }
    } catch (e) {
        console.error('Error al procesar el token de Google:', e);
        res.status(500).json({ message: 'Error interno del servidor. Token inválido o problema de conexión.' });
    }
};

// Lógica para eliminar una cuenta de usuario
export const deleteAccount = async (req, res) => {
    const userId = req.user.id;

    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.status(200).json({ message: 'Tu cuenta ha sido eliminada exitosamente.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};