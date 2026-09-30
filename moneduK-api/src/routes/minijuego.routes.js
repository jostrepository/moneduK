//Ruta del apartado de minijuegos

const router = require('express').Router();
const { body } = require('express-validator');
const { getEstadoQuiz, getPreguntas, completarQuiz } = require('../controllers/minijuegoController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

// router.use(authMiddleware): Exige un JWT válido antes de continuar; protege todas las rutas de este archivo.
    
    router.use(authMiddleware);

// GET /minijuegos/quiz/estado: Consulta si el usuario ya puede jugar el quiz o sigue en período de espera.

    router.get('/quiz/estado', getEstadoQuiz);

// GET /minijuegos/quiz/preguntas: Devuelve las 5 preguntas aleatorias para la sesión del quiz actual.

    router.get('/quiz/preguntas', getPreguntas);

// POST /minijuegos/quiz/completar: Recibe las 5 respuestas del usuario, califica el quiz y otorga koins y experiencia.

    router.post(
      '/quiz/completar',
      [
        body('respuestas')
          .isArray({ min: 5, max: 5 })
          .withMessage('Debes enviar exactamente 5 respuestas'),
        body('indices_preguntas')
          .isArray({ min: 5, max: 5 })
          .withMessage('Debes enviar los índices de las 5 preguntas'),
      ],
      validate,
      completarQuiz
    );

  module.exports = router;
