const router = require('express').Router();
const { body } = require('express-validator');
const { getTiposInversion, getMisInversiones, crearInversion, cobrarInversion } = require('../controllers/inversionController');
const { authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

router.use(authMiddleware);

router.get('/tipos',        getTiposInversion);
router.get('/',             getMisInversiones);
router.post('/:id/cobrar',  cobrarInversion);

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
