//Ruta del apartado de trabajos

const trabajoRouter = require('express').Router();
const { getTrabajos, completarTrabajo, getHistorialTrabajos } = require('../controllers/trabajoController');
const { authMiddleware } = require('../middlewares/auth');

// trabajoRouter.use(authMiddleware): Exige un JWT válido antes de continuar; protege todas las rutas de este archivo.

        trabajoRouter.use(authMiddleware);

// GET /trabajos: Lista los trabajos virtuales disponibles para realizar.

        trabajoRouter.get('/', getTrabajos);

// GET /trabajos/historial: Lista los trabajos que el usuario ya ha completado, con lo ganado en cada uno.

        trabajoRouter.get('/historial', getHistorialTrabajos);

// POST /trabajos/:id/completar: Registra la finalización de un trabajo y se otorga la recompensa correspondiente.

        trabajoRouter.post('/:id/completar', completarTrabajo);

    module.exports = { trabajoRouter };
