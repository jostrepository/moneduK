const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/response');

/**
 * Ejecuta los resultados de express-validator.
 * Si hay errores, devuelve 400 con la lista; si no, llama a next().
 */

    const validate = (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return badRequest(res, 'Error de validación', errors.array());
      }
      next();
  };

  module.exports = { validate };
