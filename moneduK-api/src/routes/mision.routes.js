const router = require('express').Router();
const { body } = require('express-validator');
const { getMisiones, iniciarMision, actualizarProgreso } = require('../controllers/misionController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(authMiddleware);

router.get('/',                   getMisiones);
router.post('/:id/iniciar',       iniciarMision);

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
