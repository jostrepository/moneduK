//Ruta del apartado de machine learning

const router = require('express').Router();
const { getPerfilCerdito } = require('../controllers/mlController');
const { authMiddleware } = require('../middlewares/auth');

        router.use(authMiddleware);

// GET /ml/perfil

        router.get('/perfil', getPerfilCerdito);

    module.exports = router;
