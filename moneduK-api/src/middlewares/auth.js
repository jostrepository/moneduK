const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/response');

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si es válido, adjunta el payload en req.user y llama a next().
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Token no proporcionado');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id_usuario, email, id_rol }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expirado');
    }
    return unauthorized(res, 'Token inválido');
  }
};

/**
 * Middleware para restringir rutas solo a tutores (id_rol === 2).
 * Debe usarse DESPUÉS de authMiddleware.
 */
const tutorOnly = (req, res, next) => {
  if (req.user?.id_rol !== 2) {
    const { forbidden } = require('../utils/response');
    return forbidden(res, 'Solo los tutores pueden acceder a este recurso');
  }
  next();
};

module.exports = { authMiddleware, tutorOnly };
