const { serverError } = require('../utils/response');

/**
 * Manejador global de errores de Express.
 * Captura cualquier error no atrapado en los controladores.
 */

// eslint-disable-next-line no-unused-vars

    const errorHandler = (err, req, res, next) => {
      console.error('🔥 Unhandled error:', err);
      return serverError(res, err, err.message || 'Error interno del servidor');
  };

/**
 * Middleware para rutas no encontradas (404).
 */

    const notFoundHandler = (req, res) => {
      res.status(404).json({
        success: false,
        message: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
      });
  };

  module.exports = { errorHandler, notFoundHandler };
