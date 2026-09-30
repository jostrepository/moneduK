const router = require('express').Router();
const { body } = require('express-validator');
const { getProductos, comprarProducto, getMisCompras, equiparProducto } = require('../controllers/tiendaController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');


// Restringimos el acceso al módulo completo interceptando peticiones sin credenciales,
// asegurando que todas las acciones comerciales estén enlazadas a un usuario autenticado.

router.use(authMiddleware);


// Servimos el catálogo de la tienda recuperando los elementos desde la base de datos,
// permitiendo a la aplicación cliente listar los productos y sus respectivos costos.

router.get('/', getProductos);


// Retornamos el histórico y estado actual de los accesorios que pertenecen al usuario,
// facilitando el control de su inventario personal y del equipo actualmente seleccionado.

router.get('/mis-compras', getMisCompras);


// Validamos la petición entrante y ejecutamos la transacción de compra en el sistema,
// descontando el saldo disponible y añadiendo el artículo al repositorio del cliente.

router.post(
  '/comprar',
  [
    body('id_producto').isInt({ min: 1 }).withMessage('Producto inválido'),
  ],
  validate,
  comprarProducto
);


// Modificamos el identificador del artículo para controlar su representación visual,
// verificando los parámetros para asegurar que los elementos se apliquen correctamente.

router.patch(
  '/equipar',
  [
    body('id_compra').isInt({ min: 1 }).withMessage('ID de compra inválido'),
    body('equipar').isBoolean().withMessage('Estado de equipamiento inválido'),
  ],
  validate,
  equiparProducto
);

module.exports = router;