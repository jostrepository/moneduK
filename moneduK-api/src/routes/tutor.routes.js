// Ruta del apartado de tutor

const router = require('express').Router();
const { body } = require('express-validator');
const { getMisEstudiantes, vincularEstudiante, getResumenEstudiante } = require('../controllers/tutorController');
const { authMiddleware, tutorOnly } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

// Restringe todo el archivo a usuarios con rol de tutor (id_rol = 2).

    router.use(authMiddleware, tutorOnly);

// GET /tutor/estudiantes: Lista los estudiantes que el tutor autenticado tiene vinculados.

    router.get('/estudiantes', getMisEstudiantes);

// POST /tutor/vincular: Vincula, por correo, a un estudiante existente con el tutor autenticado.

        router.post(
      '/vincular',
      [
        body('email_estudiante').isEmail().normalizeEmail(),
        body('tipo_relacion').optional().trim().isLength({ max: 30 }),
      ],
      validate,
      vincularEstudiante
    );

// GET /tutor/estudiantes/:id/resumen: Devuelve un resumen del progreso financiero de un estudiante vinculado.

    router.get('/estudiantes/:id/resumen', getResumenEstudiante);

  module.exports = router;
