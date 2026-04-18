const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * GET /trabajos
 * Lista todos los trabajos disponibles.
 */
const getTrabajos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_trabajo, nombre, descripcion, recompensa_koin,
              recompensa_xp, duracion_seg, imagen_url
       FROM trabajo WHERE activo = 1
       ORDER BY recompensa_koin ASC`
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * POST /trabajos/:id/completar
 * El usuario completa un trabajo y recibe KoinK + XP.
 * No hay límite de veces por trabajo (se puede repetir).
 */
const completarTrabajo = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;

    // Obtener trabajo
    const [trabajos] = await conn.query(
      'SELECT * FROM trabajo WHERE id_trabajo = ? AND activo = 1',
      [id]
    );
    if (trabajos.length === 0) return R.notFound(res, 'Trabajo no encontrado');

    const { nombre, recompensa_koin, recompensa_xp } = trabajos[0];

    // Obtener wallet
    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
      [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    await conn.beginTransaction();

    // 1. Registrar en historial de trabajos
    await conn.query(
      'INSERT INTO historial_trabajo (id_usuario, id_trabajo, koin_ganado) VALUES (?,?,?)',
      [id_usuario, id, recompensa_koin]
    );

    // 2. Acreditar KoinK
    await conn.query(
      `UPDATE wallet
       SET saldo = saldo + ?, total_ganado = total_ganado + ?
       WHERE id_wallet = ?`,
      [recompensa_koin, recompensa_koin, id_wallet]
    );

    // 3. Registrar transacción tipo "trabajo" (id_tipo = 3)
    await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion)
       VALUES (?, 3, ?, ?)`,
      [id_wallet, recompensa_koin, `Trabajo completado: ${nombre}`]
    );

    // 4. Impacto positivo en mascota (+3 salud, +XP)
    const [mascota] = await conn.query(
      'SELECT id_mascota, salud FROM mascota WHERE id_usuario = ?',
      [id_usuario]
    );
    if (mascota.length > 0) {
      const { id_mascota, salud } = mascota[0];
      const salud_nueva = Math.min(100, salud + 3);
      const [estados] = await conn.query(
        'SELECT id_estado FROM estado_mascota WHERE ? BETWEEN rango_salud_min AND rango_salud_max LIMIT 1',
        [salud_nueva]
      );
      await conn.query(
        'UPDATE mascota SET salud = ?, id_estado = ?, experiencia = experiencia + ? WHERE id_mascota = ?',
        [salud_nueva, estados[0]?.id_estado, recompensa_xp, id_mascota]
      );
      await conn.query(
        'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
        [id_mascota, salud, salud_nueva, `Completó trabajo: ${nombre}`]
      );
    }

    await conn.commit();

    return R.ok(res, {
      recompensa_koin,
      recompensa_xp,
      saldo_nuevo: saldo + recompensa_koin,
    }, `¡Trabajo "${nombre}" completado! 💼`);
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

/**
 * GET /trabajos/historial
 * Historial de trabajos completados por el usuario.
 */
const getHistorialTrabajos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ht.koin_ganado, ht.fecha,
              t.nombre, t.descripcion
       FROM historial_trabajo ht
       JOIN trabajo t ON t.id_trabajo = ht.id_trabajo
       WHERE ht.id_usuario = ?
       ORDER BY ht.fecha DESC
       LIMIT 50`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

module.exports = { getTrabajos, completarTrabajo, getHistorialTrabajos };
