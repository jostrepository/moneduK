//Ruta del apartado de trabajos

const trabajoRouter = require('express').Router();
const { getTrabajos, completarTrabajo, getHistorialTrabajos } = require('../controllers/trabajoController');
const { authMiddleware } = require('../middlewares/auth');

        trabajoRouter.use(authMiddleware);
        trabajoRouter.get('/', getTrabajos);
        trabajoRouter.get('/historial', getHistorialTrabajos);
        trabajoRouter.post('/:id/completar', completarTrabajo);

    module.exports = { trabajoRouter };
