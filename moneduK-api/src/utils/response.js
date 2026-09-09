/**
 * Respuestas JSON estandarizadas para toda la API.
 * Formato: { success, message, data } o { success, message, errors }
 */

    const ok = (res, data = null, message = 'OK', status = 200) =>
      res.status(status).json({ success: true, message, data });

    const created = (res, data = null, message = 'Recurso creado') =>
      ok(res, data, message, 201);

    const badRequest = (res, message = 'Solicitud inválida', errors = null) =>
      res.status(400).json({ success: false, message, errors });

    const unauthorized = (res, message = 'No autorizado') =>
      res.status(401).json({ success: false, message });

    const forbidden = (res, message = 'Acceso denegado') =>
      res.status(403).json({ success: false, message });

    const notFound = (res, message = 'Recurso no encontrado') =>
      res.status(404).json({ success: false, message });

    const conflict = (res, message = 'Conflicto con recurso existente') =>
      res.status(409).json({ success: false, message });

    const serverError = (res, err, message = 'Error interno del servidor') => {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔥  Server error:', err);
      }
      return res.status(500).json({ success: false, message });
  };

  module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, conflict, serverError };
