const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

// POST /auth/register
router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
    body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('contrasena')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('id_rol')
      .optional()
      .isIn([1, 2])
      .withMessage('Rol inválido (1=estudiante, 2=tutor)'),
    body('fecha_nacimiento')
      .optional()
      .isDate()
      .withMessage('Fecha de nacimiento inválida'),
  ],
  validate,
  register
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('contrasena').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  login
);

// GET /auth/me  (protegida)
router.get('/me', authMiddleware, me);

module.exports = router;
