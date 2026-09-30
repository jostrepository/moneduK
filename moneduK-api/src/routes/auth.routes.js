const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');


    // Definimos la ruta de registro aplicando una cadena de validadores estrictos
    // para garantizar que la estructura de los datos sea correcta antes de operar.

    router.post(
      '/register',
      [
        body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
        body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('contrasena')
          .isLength({ min: 8 })
          .withMessage('La contraseña debe tener al menos 8 caracteres'),
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


    // Exponemos el endpoint de acceso validando únicamente el formato del correo
    // y la presencia de la contraseña para delegar la autenticación al controlador.

    router.post(
      '/login',
      [
        body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
        body('contrasena').notEmpty().withMessage('La contraseña es requerida'),
      ],
      validate,
      login
    );


    // Protegemos la ruta del perfil inyectando el middleware de verificación JWT
    // asegurando que solo usuarios con sesión activa puedan consultar sus datos.

    router.get('/me', authMiddleware, me);

  module.exports = router;