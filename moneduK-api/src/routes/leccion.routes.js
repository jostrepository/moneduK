// Ruta del apartado de lecciones

const router = require('express').Router();
const { body } = require('express-validator');
const { getLecciones, getLeccion, completarLeccion } = require('../controllers/leccionController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

    router.use(authMiddleware);

// GET /lecciones: Lista todas las lecciones educativas disponibles.

    router.get('/', getLecciones);

// GET /lecciones/:id: Devuelve el contenido detallado de una lección específica.

    router.get('/:id', getLeccion);

// POST /lecciones/:id/completar: Marca una lección como completada y guarda el puntaje del quiz asociado.

    router.post(
      '/:id/completar',
      [
        body('puntaje_quiz')
          .optional()
          .isInt({ min: 0, max: 100 })
          .withMessage('El puntaje debe ser entre 0 y 100'),
      ],
      validate,
      completarLeccion
    );

  module.exports = router;
