const router = require('express').Router();
const { body } = require('express-validator');
const { getMisiones, iniciarMision, actualizarProgreso } = require('../controllers/misionController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');


// Protegemos la lectura y escritura de misiones mediante nuestro filtro de autenticación,
// previniendo alteraciones no autorizadas en el progreso y las recompensas del sistema.

router.use(authMiddleware);


// Consolidamos la información de las misiones globales junto con el avance individual,
// exponiendo los datos necesarios para renderizar el panel de control interactivo.

router.get('/', getMisiones);


// Asociamos oficialmente un reto disponible a la cuenta activa de nuestro usuario,
// instanciando la primera huella de progreso para habilitar el seguimiento del objetivo.

router.post('/:id/iniciar', iniciarMision);


// Inyectamos validaciones estrictas en el avance reportado para evitar incrementos negativos,
// delegando la lógica de finalización al controlador responsable de repartir los beneficios.

router.patch(
  '/:id/progreso',
  [
    body('incremento')
      .isFloat({ min: 0.01 })
      .withMessage('El incremento debe ser mayor a 0'),
  ],
  validate,
  actualizarProgreso
);

module.exports = router;