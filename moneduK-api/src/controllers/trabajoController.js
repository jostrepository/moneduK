const { pool } = require('../config/db');
const R = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');
const { triggerMision } = require('../utils/misionHelper');

const getTrabajos = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const [conteo] = await pool.query(
      `SELECT COUNT(*) AS total FROM historial_trabajo
      WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id_usuario]
    );
    const trabajosUltimaHora = conteo[0].total;
    const bloqueado = trabajosUltimaHora >= 2;

    let segundos_para_liberar = 0;
    if (bloqueado) {
      const [primero] = await pool.query(
        `SELECT fecha FROM historial_trabajo
        WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ORDER BY fecha ASC LIMIT 1`,
        [id_usuario]
      );
      if (primero.length > 0) {
        const liberacion = new Date(primero[0].fecha).getTime() + 60 * 60 * 1000;
        segundos_para_liberar = Math.max(0, Math.ceil((liberacion - Date.now()) / 1000));
      }
    }

    const [trabajos] = await pool.query(
      'SELECT * FROM trabajo WHERE activo = 1 ORDER BY recompensa_koin ASC'
    );

    return R.ok(res, {
      trabajos,
      trabajos_en_ultima_hora: trabajosUltimaHora,
      limite_por_hora:         2,
      bloqueado,
      segundos_para_liberar,
    });
  } catch (err) { return R.serverError(res, err); }
};

const completarTrabajo = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;

    const [conteo] = await conn.query(
      `SELECT COUNT(*) AS total FROM historial_trabajo WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id_usuario]
    );
    if (conteo[0].total >= 2) return R.badRequest(res, 'Has alcanzado el límite de 2 trabajos por hora. Espera antes de trabajar de nuevo.');

    const [trabajos] = await conn.query('SELECT * FROM trabajo WHERE id_trabajo = ? AND activo = 1', [id]);
    if (trabajos.length === 0) return R.notFound(res, 'Trabajo no encontrado');
    const trabajo = trabajos[0];

    const xp_min = trabajo.recompensa_xp_min || 20;
    const xp_max = trabajo.recompensa_xp_max || 50;
    const xp_ganado = Math.floor(Math.random() * (xp_max - xp_min + 1)) + xp_min;

    const salud_min = trabajo.salud_min || 2;
    const salud_max = trabajo.salud_max || 5;
    const salud_delta = Math.floor(Math.random() * (salud_max - salud_min + 1)) + salud_min;

    const koin = Number(trabajo.recompensa_koin);

    const [walletRows] = await conn.query('SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]);
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    await conn.beginTransaction();

    await conn.query('INSERT INTO historial_trabajo (id_usuario, id_trabajo, koin_ganado) VALUES (?,?,?)', [id_usuario, id, koin]);

    await conn.query(
      'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
      [koin, koin, id_wallet]
    );

    await conn.query(
      'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,3,?,?)',
      [id_wallet, koin, `Trabajo completado: ${trabajo.nombre}`]
    );

    const mascotaResult = await aplicarXPySalud(conn, id_usuario, xp_ganado, salud_delta, 95, `Completó trabajo: ${trabajo.nombre}`);

    // AQUÍ conectamos el trabajo con las misiones. Si el usuario gana 50 KoinKs, le avisa a las misiones.
    await triggerMision(conn, id_usuario, 'trabajo', koin);

    const [nuevoConteo] = await conn.query(
      `SELECT COUNT(*) AS total FROM historial_trabajo WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id_usuario]
    );
    const trabajos_restantes = Math.max(0, 2 - nuevoConteo[0].total);

    await conn.commit();

    return R.ok(res, { recompensa_koin: koin, xp_ganado, salud_ganada: salud_delta, saldo_nuevo: Number(saldo) + koin, mascota: mascotaResult, trabajos_restantes_en_hora: trabajos_restantes }, `¡Trabajo "${trabajo.nombre}" completado! 💼`);
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

const getHistorialTrabajos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ht.koin_ganado, ht.fecha, t.nombre, t.descripcion
      FROM historial_trabajo ht
      JOIN trabajo t ON t.id_trabajo = ht.id_trabajo
      WHERE ht.id_usuario = ?
      ORDER BY ht.fecha DESC LIMIT 50`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) { return R.serverError(res, err); }
};

module.exports = { getTrabajos, completarTrabajo, getHistorialTrabajos };