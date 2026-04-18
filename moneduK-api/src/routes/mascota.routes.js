const router = require('express').Router();
const { body } = require('express-validator');
const { getMiMascota, aplicarImpacto, renombrarMascota, getHistorial } = require('../controllers/mascotaController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(authMiddleware);

// GET /mascota
router.get('/', getMiMascota);

// GET /mascota/historial
router.get('/historial', getHistorial);

// PATCH /mascota/impacto
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

// PATCH /mascota/nombre
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
