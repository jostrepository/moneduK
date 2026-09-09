//Ruta del apartado de la billetera virtual

const router = require('express').Router();
const { body, query } = require('express-validator');
const { getMiWallet, getTransacciones, registrarTransaccion } = require('../controllers/walletController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

    router.use(authMiddleware);

// GET /wallet

    router.get('/', getMiWallet);

// GET /wallet/transacciones

    router.get(
      '/transacciones',
      [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
      ],
      validate,
      getTransacciones
    );

// POST /wallet/transaccion

    router.post(
      '/transaccion',
      [
        body('id_tipo').isInt({ min: 1 }).withMessage('Tipo de transacción inválido'),
        body('monto').isFloat({ min: 0.01 }).withMessage('Monto inválido'),
        body('descripcion').optional().trim().isLength({ max: 200 }),
      ],
      validate,
      registrarTransaccion
    );

  module.exports = router;
