const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * GET /tutor/estudiantes
 * Devuelve los estudiantes vinculados al tutor autenticado.
 */

    const getMisEstudiantes = async (req, res) => {
      try {
        const [rows] = await pool.query(
          `SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.fecha_nacimiento,
              te.tipo_relacion, te.fecha_vinculo,
              w.saldo,
              m.salud AS mascota_salud, m.nivel AS mascota_nivel,
              e.nombre AS mascota_estado
          FROM tutor_estudiante te
          JOIN usuario u ON u.id_usuario = te.id_estudiante
          LEFT JOIN wallet w ON w.id_usuario = u.id_usuario
          LEFT JOIN mascota m ON m.id_usuario = u.id_usuario
          LEFT JOIN estado_mascota e ON e.id_estado = m.id_estado
          WHERE te.id_tutor = ?`,
          [req.user.id_usuario]
        );
        return R.ok(res, rows);
      } catch (err) {
        return R.serverError(res, err);
      }
  };

/**
 * POST /tutor/vincular
 * Vincula un estudiante al tutor por email del estudiante.
 * Body: { email_estudiante, tipo_relacion }
 */

    const vincularEstudiante = async (req, res) => {
      try {
        const { email_estudiante, tipo_relacion = 'padre/madre' } = req.body;

    // Buscar estudiante

        const [estudiantes] = await pool.query(
          `SELECT id_usuario FROM usuario WHERE email = ? AND id_rol = 1`,
          [email_estudiante]
        );
        if (estudiantes.length === 0) {
          return R.notFound(res, 'Estudiante no encontrado con ese correo');
        }

        const id_estudiante = estudiantes[0].id_usuario;

    // Evitar duplicados

        const [existe] = await pool.query(
          'SELECT 1 FROM tutor_estudiante WHERE id_tutor = ? AND id_estudiante = ?',
          [req.user.id_usuario, id_estudiante]
        );
        if (existe.length > 0) {
          return R.conflict(res, 'El estudiante ya está vinculado a este tutor');
        }

        await pool.query(
          'INSERT INTO tutor_estudiante (id_tutor, id_estudiante, tipo_relacion) VALUES (?,?,?)',
          [req.user.id_usuario, id_estudiante, tipo_relacion]
        );

        return R.created(res, { id_estudiante }, 'Estudiante vinculado exitosamente');
      } catch (err) {
        return R.serverError(res, err);
      }
  };

/**
 * GET /tutor/estudiantes/:id/resumen
 * Resumen de actividad de un estudiante específico.
 */

    const getResumenEstudiante = async (req, res) => {
      try {
        const { id } = req.params;

    // Verificar que el estudiante pertenece a este tutor

        const [vinculo] = await pool.query(
          'SELECT 1 FROM tutor_estudiante WHERE id_tutor = ? AND id_estudiante = ?',
          [req.user.id_usuario, id]
        );
        if (vinculo.length === 0) return R.forbidden(res, 'No tienes acceso a este estudiante');

        const [[usuario]] = await pool.query(
          `SELECT u.nombre, u.apellido, u.email,
              w.saldo, w.total_ganado, w.total_gastado,
              m.salud, m.nivel, m.experiencia,
              e.nombre AS estado_mascota
          FROM usuario u
          LEFT JOIN wallet w ON w.id_usuario = u.id_usuario
          LEFT JOIN mascota m ON m.id_usuario = u.id_usuario
          LEFT JOIN estado_mascota e ON e.id_estado = m.id_estado
          WHERE u.id_usuario = ?`,
          [id]
        );

        const [lecciones] = await pool.query(
          `SELECT COUNT(*) AS total_completadas FROM progreso_leccion
          WHERE id_usuario = ? AND completada = 1`,
          [id]
        );

        const [transacciones] = await pool.query(
          `SELECT t.monto, t.descripcion, t.fecha, tt.nombre AS tipo, tt.es_positivo
          FROM transaccion t
          JOIN wallet w ON w.id_wallet = t.id_wallet
          JOIN tipo_transaccion tt ON tt.id_tipo = t.id_tipo
          WHERE w.id_usuario = ?
          ORDER BY t.fecha DESC LIMIT 10`,
          [id]
        );

        return R.ok(res, {
          usuario,
          lecciones_completadas: lecciones[0].total_completadas,
          ultimas_transacciones: transacciones,
        });
      } catch (err) {
        return R.serverError(res, err);
      }
  };

  module.exports = { getMisEstudiantes, vincularEstudiante, getResumenEstudiante };
