// Ruta del apartado de apuestas

const router = require('express').Router();
const { body } = require('express-validator');
const { realizarApuesta, getHistorialApuestas } = require('../controllers/apuestaController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

      router.use(authMiddleware);

// GET /apuestas/historial: Lista las apuestas que el usuario ha realizado.

      router.get('/historial', getHistorialApuestas);

// POST /apuestas: Registra una nueva apuesta con el monto indicado y calcula su resultado.

      router.post(
        '/',
        [
          body('monto')
            .isFloat({ min: 1 })
          .withMessage('El monto debe ser mayor a 0'),
        ],
          validate,
          realizarApuesta
      );

    module.exports = router;
