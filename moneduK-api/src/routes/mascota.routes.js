// Ruta del apartado de mascota

const router = require('express').Router();
const { body } = require('express-validator');
const { getMiMascota, aplicarImpacto, renombrarMascota, getHistorial } = require('../controllers/mascotaController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

// Exige un JWT válido antes de continuar, y protege todas las rutas de este archivo.

    router.use(authMiddleware);

// GET /mascota: Devuelve el estado actual de la mascota del usuario autenticado (salud, nivel, experiencia).

    router.get('/', getMiMascota);

// GET /mascota/historial: Devuelve el historial de cambios de salud registrados para la mascota.

    router.get('/historial', getHistorial);

// PATCH /mascota/impacto: Aplica un cambio de salud (positivo o negativo) a la mascota, con un motivo opcional.

    router.patch(
      '/impacto',
      [
        body('delta')
          .isNumeric()
          .withMessage('delta debe ser un número')
          .custom(v => v !== 0)
          .withMessage('delta no puede ser 0'),
        body('motivo').optional().trim().isLength({ max: 150 }),
      ],
      validate,
      aplicarImpacto
    );

// PATCH /mascota/nombre: Cambia el nombre que el usuario le puso a su mascota.

    router.patch(
      '/nombre',
      [
        body('nombre')
          .trim()
          .notEmpty()
          .isLength({ max: 60 })
          .withMessage('Nombre inválido'),
      ],
      validate,
      renombrarMascota
    );

  module.exports = router;
