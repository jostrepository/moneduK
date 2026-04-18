const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * GET /misiones
 * Lista todas las misiones con el progreso actual del usuario.
 */
const getMisiones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id_mision, m.titulo, m.descripcion, m.tipo,
              m.meta_cantidad, m.recompensa_koin, m.recompensa_xp,
              m.recompensa_salud, m.duracion_dias,
              COALESCE(mu.progreso, 0)     AS progreso,
              COALESCE(mu.completada, 0)   AS completada,
              mu.fecha_asignacion,
              mu.fecha_completado
       FROM mision m
       LEFT JOIN mision_usuario mu
         ON mu.id_mision = m.id_mision AND mu.id_usuario = ?
       WHERE m.activa = 1
       ORDER BY mu.completada ASC, m.id_mision ASC`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * POST /misiones/:id/iniciar
 * El usuario acepta/inicia una misión.
 */
const iniciarMision = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;

    const [mision] = await pool.query(
      'SELECT * FROM mision WHERE id_mision = ? AND activa = 1',
      [id]
    );
    if (mision.length === 0) return R.notFound(res, 'Misión no encontrada');

    // Verificar si ya fue iniciada
    const [existente] = await pool.query(
      'SELECT * FROM mision_usuario WHERE id_usuario = ? AND id_mision = ?',
      [id_usuario, id]
    );
    if (existente.length > 0) {
      return R.conflict(res, 'Ya iniciaste esta misión');
    }

    await pool.query(
      'INSERT INTO mision_usuario (id_usuario, id_mision) VALUES (?,?)',
      [id_usuario, id]
    );

    return R.created(res, null, `¡Misión "${mision[0].titulo}" iniciada! 🎯`);
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * PATCH /misiones/:id/progreso
 * Actualiza el progreso de una misión.
 * Body: { incremento: number }
 * Cuando progreso >= meta_cantidad, la misión se completa automáticamente.
 */
const actualizarProgreso = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { incremento } = req.body;
    const id_usuario = req.user.id_usuario;

    // Obtener misión y progreso actual
    const [rows] = await pool.query(
      `SELECT m.*, mu.progreso, mu.completada
       FROM mision m
       JOIN mision_usuario mu ON mu.id_mision = m.id_mision
       WHERE m.id_mision = ? AND mu.id_usuario = ?`,
      [id, id_usuario]
    );
    if (rows.length === 0) return R.notFound(res, 'Misión no iniciada');

    const mision = rows[0];
    if (mision.completada) return R.badRequest(res, 'Esta misión ya fue completada');

    const progreso_nuevo = parseFloat(
      Math.min(mision.progreso + incremento, mision.meta_cantidad || 9999).toFixed(2)
    );
    const se_completa = mision.meta_cantidad && progreso_nuevo >= mision.meta_cantidad;

    await conn.beginTransaction();

    // Actualizar progreso
    await conn.query(
      `UPDATE mision_usuario
       SET progreso = ?,
           completada = ?,
           fecha_completado = IF(?, NOW(), NULL)
       WHERE id_usuario = ? AND id_mision = ?`,
      [progreso_nuevo, se_completa ? 1 : 0, se_completa, id_usuario, id]
    );

    let recompensas = null;

    if (se_completa) {
      // Entregar recompensas
      const [walletRows] = await conn.query(
        'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
        [id_usuario]
      );
      const { id_wallet, saldo } = walletRows[0];

      if (mision.recompensa_koin > 0) {
        await conn.query(
          'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
          [mision.recompensa_koin, mision.recompensa_koin, id_wallet]
        );
        await conn.query(
          'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,7,?,?)',
          [id_wallet, mision.recompensa_koin, `Recompensa misión: ${mision.titulo}`]
        );
      }

      // Impacto en mascota
      const [mascota] = await conn.query(
        'SELECT id_mascota, salud FROM mascota WHERE id_usuario = ?',
        [id_usuario]
      );
      if (mascota.length > 0) {
        const { id_mascota, salud } = mascota[0];
        const salud_nueva = Math.min(100, salud + mision.recompensa_salud);
        const [estados] = await conn.query(
          'SELECT id_estado FROM estado_mascota WHERE ? BETWEEN rango_salud_min AND rango_salud_max LIMIT 1',
          [salud_nueva]
        );
        await conn.query(
          'UPDATE mascota SET salud = ?, id_estado = ?, experiencia = experiencia + ? WHERE id_mascota = ?',
          [salud_nueva, estados[0]?.id_estado, mision.recompensa_xp, id_mascota]
        );
        await conn.query(
          'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
          [id_mascota, salud, salud_nueva, `Completó misión: ${mision.titulo}`]
        );
      }

      recompensas = {
        koin:  mision.recompensa_koin,
        xp:    mision.recompensa_xp,
        salud: mision.recompensa_salud,
        saldo_nuevo: walletRows[0].saldo + mision.recompensa_koin,
      };
    }

    await conn.commit();

    return R.ok(res, {
      progreso_nuevo,
      completada: se_completa,
      recompensas,
    }, se_completa
      ? `¡Misión "${mision.titulo}" completada! 🏆`
      : 'Progreso actualizado'
    );
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getMisiones, iniciarMision, actualizarProgreso };
