const jwt = require('jsonwebtoken');
const { unauthorized } = require('../utils/response');


    // Interceptamos las peticiones para validar la presencia y firma del token JWT
    // bloqueando el acceso si la cabecera está ausente o no tiene el formato correcto.

    const authMiddleware = (req, res, next) => {
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return unauthorized(res, 'Token no proporcionado');
      }

      const token = authHeader.split(' ')[1];

      try {


        // Decodificamos la carga útil del token para incrustarla en el objeto request
        // permitiendo que los controladores posteriores identifiquen al usuario emisor.

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


    // Evaluamos el rol del usuario autenticado para restringir zonas administrativas
    // rechazando automáticamente cualquier solicitud que provenga de un estudiante.

    const tutorOnly = (req, res, next) => {
      if (req.user?.id_rol !== 2) {
        const { forbidden } = require('../utils/response');
        return forbidden(res, 'Solo los tutores pueden acceder a este recurso');
      }
      next();
    };

    module.exports = { authMiddleware, tutorOnly };