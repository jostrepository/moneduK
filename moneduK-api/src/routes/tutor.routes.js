//Ruta del apartado de tutor

const router = require('express').Router();
const { body } = require('express-validator');
const { getMisEstudiantes, vincularEstudiante, getResumenEstudiante } = require('../controllers/tutorController');
const { authMiddleware, tutorOnly } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

    router.use(authMiddleware, tutorOnly);

// GET /tutor/estudiantes

    router.get('/estudiantes', getMisEstudiantes);

// POST /tutor/vincular

        router.post(
      '/vincular',
      [
        body('email_estudiante').isEmail().normalizeEmail(),
        body('tipo_relacion').optional().trim().isLength({ max: 30 }),
      ],
      validate,
      vincularEstudiante
    );

// GET /tutor/estudiantes/:id/resumen

    router.get('/estudiantes/:id/resumen', getResumenEstudiante);

  module.exports = router;
