//Ruta del apartado de la billetera virtual

const router = require('express').Router();
const { body, query } = require('express-validator');
const { getMiWallet, getTransacciones, registrarTransaccion } = require('../controllers/walletController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

// router.use(authMiddleware): Exige un JWT válido antes de continuar; protege todas las rutas de este archivo.

    router.use(authMiddleware);

// GET /wallet: GET /wallet → Consulta el saldo y los totales (ganado/gastado) de la billetera del usuario.

    router.get('/', getMiWallet);

// GET /wallet/transacciones: Lista el historial de transacciones del usuario, paginado con limit y offset.

    router.get(
      '/transacciones',
      [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
      ],
      validate,
      getTransacciones
    );

// POST /wallet/transaccion: Registra manualmente una transacción (monto, tipo y descripción) en la billetera.

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
