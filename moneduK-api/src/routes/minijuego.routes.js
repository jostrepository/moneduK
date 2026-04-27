const router = require('express').Router();
const { body } = require('express-validator');
const { getEstadoQuiz, getPreguntas, completarQuiz } = require('../controllers/minijuegoController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(authMiddleware);

// GET /minijuegos/quiz/estado
router.get('/quiz/estado', getEstadoQuiz);

// GET /minijuegos/quiz/preguntas
router.get('/quiz/preguntas', getPreguntas);

// POST /minijuegos/quiz/completar
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
