// backend/middlewares/auth.js
import jwt from 'jsonwebtoken';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'FirmaSecretaCrissair2026';
  if (!secret) {
    throw new Error('CRÍTICO: La variable de entorno JWT_SECRET no está configurada.');
  }
  return secret;
};

export const generateToken = (payload, expiresIn = '8h') => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('El payload debe ser un objeto válido.');
  }

  return jwt.sign(payload, getSecretKey(), { expiresIn });
};

export const extractTokenFromHeader = (req) => {
  const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  // Valida que el esquema sea estricto 'Bearer' y exista el token
  if (/^Bearer$/i.test(scheme) && token) {
    return token;
  }

  return null;
};

export const validateToken = (token) => {
  if (!token) {
    throw new Error('Token no proporcionado.');
  }

  return jwt.verify(token, getSecretKey());
};

export const verificarToken = (req, res, next) => {
  // 1. Obtener el token
  const token = extractTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Se requiere iniciar sesión.' });
  }

  try {
    // 2. Validar el token
    const decodedPayload = validateToken(token);

    // Adjuntamos el payload a la request
    req.user = decodedPayload;
    next();
  } catch (error) {
    // Manejo limpio de expiración o alteración
    const message = error.name === 'TokenExpiredError'
      ? 'El token ha expirado.'
      : 'Token inválido o manipulado.';

    return res.status(403).json({ error: message });
  }
};
