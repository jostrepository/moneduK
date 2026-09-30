// Ruta del apartado de inversión

const router = require('express').Router();
const { body } = require('express-validator');
const { getTiposInversion, getMisInversiones, crearInversion, cobrarInversion } = require('../controllers/inversionController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

    router.use(authMiddleware);

// GET /inversiones/tipos: Lista los tipos de inversión disponibles, con su rendimiento esperado.

    router.get('/tipos', getTiposInversion);

// GET /inversiones: Lista las inversiones (activas o pasadas) del usuario autenticado.

    router.get('/', getMisInversiones);

// POST /inversiones/:id/cobrar: Liquida una inversión vencida y acredita su rendimiento al wallet.

    router.post('/:id/cobrar',cobrarInversion);

// POST /inversiones: Crea una nueva inversión del tipo y monto indicados por el usuario.
    
    router.post(
      '/',
      [
        body('id_tipo_inv').isInt({ min: 1 }).withMessage('Tipo de inversión inválido'),
        body('monto').isFloat({ min: 1 }).withMessage('El monto debe ser mayor a 0'),
      ],
      validate,
      crearInversion
    );

  module.exports = router;
