//Ruta del apartado de machine learning

const router = require('express').Router();
const { getPerfilCerdito } = require('../controllers/mlController');
const { authMiddleware } = require('../middlewares/auth');

        router.use(authMiddleware);

// GET /ml/perfil: Consulta el perfil de personalidad financiera que el modelo de aprendizaje automático 
// le asignó al usuario, según su comportamiento en la app.

        router.get('/perfil', getPerfilCerdito);

    module.exports = router;
