// backend/middlewares/auth.js
import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
    // Buscamos el token en las cabeceras de la petición (viene como "Bearer el_token_largo")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Si no trae token, lo rebotamos inmediatamente
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
    }

    try {
        // Traemos la misma firma secreta del .env
        const firmaSecreta = process.env.JWT_SECRET || 'FirmaSecretaCrissair2026';
        
        // Verificamos que el token sea auténtico y no haya expirado
        const usuarioVerificado = jwt.verify(token, firmaSecreta);
        
        // Si es válido, guardamos los datos del usuario en la petición y lo dejamos pasar
        req.usuario = usuarioVerificado;
        next(); 
        
    } catch (error) {
        // Si el token es falso, fue modificado o ya pasaron las 8 horas
        return res.status(401).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }
};