const { pool }            = require('../config/db');
const R                   = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');

// ─── Listar trabajos con estado de cooldown ───────────────
/**
 * GET /trabajos
 * Devuelve los trabajos disponibles con:
 * - trabajos_en_ultima_hora: cuántos hizo el usuario en la última hora
 * - bloqueado: true si ya llegó al límite de 2/hora
 * - tiempo_espera_seg: tiempo de espera propio del trabajo (1-5min según dificultad)
 */
const getTrabajos = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    // Contar trabajos en la última hora
    const [conteo] = await pool.query(
      `SELECT COUNT(*) AS total FROM historial_trabajo
       WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id_usuario]
    );
    const trabajosUltimaHora = conteo[0].total;
    const bloqueado          = trabajosUltimaHora >= 2;

    // Si está bloqueado, calcular cuándo se libera
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

// ─── Completar trabajo ────────────────────────────────────
/**
 * POST /trabajos/:id/completar
 * Reglas:
 * - Máximo 2 trabajos por hora
 * - XP aleatorio entre recompensa_xp_min y recompensa_xp_max del trabajo
 * - Salud: entre salud_min y salud_max del trabajo (umbral 95)
 * - El frontend debe respetar el tiempo de espera (tiempo_espera_seg)
 */
const completarTrabajo = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id }     = req.params;
    const id_usuario = req.user.id_usuario;

    // Verificar límite de 2 trabajos por hora
    const [conteo] = await conn.query(
      `SELECT COUNT(*) AS total FROM historial_trabajo
       WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id_usuario]
    );
    if (conteo[0].total >= 2) {
      return R.badRequest(
        res,
        'Has alcanzado el límite de 2 trabajos por hora. Espera antes de trabajar de nuevo.'
      );
    }

    // Obtener trabajo
    const [trabajos] = await conn.query(
      'SELECT * FROM trabajo WHERE id_trabajo = ? AND activo = 1', [id]
    );
    if (trabajos.length === 0) return R.notFound(res, 'Trabajo no encontrado');
    const trabajo = trabajos[0];

    // ── XP aleatorio entre min y max ──────────────────────
    const xp_min = trabajo.recompensa_xp_min || 20;
    const xp_max = trabajo.recompensa_xp_max || 50;
    const xp_ganado = Math.floor(Math.random() * (xp_max - xp_min + 1)) + xp_min;

    // ── Salud aleatoria entre min y max ───────────────────
    const salud_min   = trabajo.salud_min || 2;
    const salud_max   = trabajo.salud_max || 5;
    const salud_delta = Math.floor(Math.random() * (salud_max - salud_min + 1)) + salud_min;

    // KoinK del trabajo
    const koin = Number(trabajo.recompensa_koin);

    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    await conn.beginTransaction();

    // 1. Registrar en historial
    await conn.query(
      'INSERT INTO historial_trabajo (id_usuario, id_trabajo, koin_ganado) VALUES (?,?,?)',
      [id_usuario, id, koin]
    );

    // 2. Acreditar KoinK
    await conn.query(
      'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
      [koin, koin, id_wallet]
    );

    // 3. Transacción
    await conn.query(
      'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,3,?,?)',
      [id_wallet, koin, `Trabajo completado: ${trabajo.nombre}`]
    );

    // 4. XP y salud (umbral 95)
    const mascotaResult = await aplicarXPySalud(
      conn, id_usuario,
      xp_ganado,
      salud_delta,
      95,   // umbral: si salud >= 95, ajusta hasta 100
      `Completó trabajo: ${trabajo.nombre}`
    );

    // Contar trabajos restantes en esta hora
    const [nuevoConteo] = await conn.query(
      `SELECT COUNT(*) AS total FROM historial_trabajo
       WHERE id_usuario = ? AND fecha >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [id_usuario]
    );
    const trabajos_restantes = Math.max(0, 2 - nuevoConteo[0].total);

    await conn.commit();

    return R.ok(res, {
      recompensa_koin:    koin,
      xp_ganado,
      salud_ganada:       salud_delta,
      saldo_nuevo:        Number(saldo) + koin,
      mascota:            mascotaResult,
      trabajos_restantes_en_hora: trabajos_restantes,
    }, `¡Trabajo "${trabajo.nombre}" completado! 💼`);
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

// ─── Historial ────────────────────────────────────────────
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
