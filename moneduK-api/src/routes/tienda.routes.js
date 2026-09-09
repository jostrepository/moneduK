//Ruta del apartado de tienda

const router = require('express').Router();
const { body } = require('express-validator');
const { getProductos, comprarProducto, getMisCompras } = require('../controllers/tiendaController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

    router.use(authMiddleware);

    router.get('/', getProductos);
    router.get('/mis-compras', getMisCompras);

    router.post(
      '/comprar',
      [
        body('id_producto').isInt({ min: 1 }).withMessage('Producto inválido'),
      ],
      validate,
      comprarProducto
    );

  module.exports = router;
