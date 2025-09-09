// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (token == null) {
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.sendStatus(403); // Forbidden (token inválido o expirado)
        }
        req.user = payload.user; // Guarda la info del usuario del token en la petición
        next();
    });
};

module.exports = authenticateToken;
