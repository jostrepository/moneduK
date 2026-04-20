const { pool }            = require('../config/db');
const R                   = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');

const LECCIONES_MORALES = [
  'Apostar es arriesgado: puedes perder todo lo que tienes. ¡El dinero se gana con esfuerzo!',
  'Los juegos de azar están diseñados para que la casa siempre gane. ¡Mejor ahorra ese dinero!',
  'Una persona que apuesta frecuentemente puede perder mucho más de lo que gana.',
  'En lugar de apostar, ¿qué tal invertir? Con inversiones tu dinero crece de forma segura.',
  'El dinero fácil casi nunca existe. Lo que se gana con trabajo vale mucho más.',
  '¿Sabías que muchas personas pierden sus ahorros apostando? ¡Cuida tu KoinK!',
];

// ─── Realizar apuesta ─────────────────────────────────────
/**
 * POST /apuestas
 * Reglas:
 * - 25% probabilidad de DUPLICAR la apuesta (ganar el monto apostado)
 * - 75% probabilidad de PERDER lo apostado
 * - SIEMPRE -10 HP al cerdito (sin importar resultado)
 * - NO genera XP
 */
const realizarApuesta = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { monto }  = req.body;
    const id_usuario = req.user.id_usuario;

    // Verificar saldo
    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    if (Number(saldo) < monto) {
      return R.badRequest(res, 'No tienes suficiente KoinK para apostar');
    }

    // ── 25% ganar / 75% perder ────────────────────────────
    const gano           = Math.random() < 0.25;
    const resultado      = gano ? 'ganó' : 'perdió';
    // Si gana: recibe el doble (monto apostado * 2)
    // Si pierde: recibe 0
    const monto_resultado = gano ? parseFloat((monto * 2).toFixed(2)) : 0;

    // Delta de saldo:
    //   ganó  → recibe monto * 2, pero ya se descontó el monto → ganancia neta = monto
    //   perdió → pierde el monto apostado
    const delta_saldo = gano ? monto : -monto;
    const saldo_nuevo = parseFloat((Number(saldo) + delta_saldo).toFixed(2));

    // Mensaje educativo aleatorio
    const leccion_moral = LECCIONES_MORALES[Math.floor(Math.random() * LECCIONES_MORALES.length)];

    // Daño fijo: -10 HP siempre, 0 XP
    const impacto_salud = -10;

    await conn.beginTransaction();

    // 1. Registrar apuesta
    const [apuestaResult] = await conn.query(
      `INSERT INTO apuesta
         (id_usuario, monto_apostado, resultado, monto_resultado, leccion_moral, impacto_salud)
       VALUES (?,?,?,?,?,?)`,
      [id_usuario, monto, resultado, monto_resultado, leccion_moral, impacto_salud]
    );

    // 2. Actualizar wallet
    await conn.query(
      `UPDATE wallet
       SET saldo         = saldo + ?,
           total_gastado = total_gastado + ?
       WHERE id_wallet = ?`,
      [delta_saldo, monto, id_wallet]
    );

    // 3. Transacción
    await conn.query(
      'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,5,?,?)',
      [id_wallet, monto, `Apuesta — ${resultado} (${gano ? '+' + monto : '-' + monto} KoinK)`]
    );

    // 4. -10 HP siempre, 0 XP
    const mascotaResult = await aplicarXPySalud(
      conn, id_usuario,
      0,            // sin XP
      impacto_salud, // -10 HP
      100,          // umbral no importa (es daño, siempre se aplica)
      'Realizó una apuesta'
    );

    await conn.commit();

    return R.ok(res, {
      resultado,
      monto_apostado:  monto,
      monto_resultado,
      delta_saldo,
      saldo_nuevo,
      mascota:         mascotaResult,
      salud_perdida:   10,
      xp_ganado:       0,
      leccion_moral,
      advertencia:     '⚠️ Apostar siempre quita 10 HP a tu cerdito, aunque ganes.',
    }, gano
      ? `¡Ganaste 🪙 ${monto} KoinK extra! Pero tu cerdito perdió 10 HP 😟`
      : `Perdiste 🪙 ${monto} KoinK y tu cerdito perdió 10 HP 😢`
    );
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

// ─── Historial ────────────────────────────────────────────
const getHistorialApuestas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT monto_apostado, resultado, monto_resultado,
              leccion_moral, impacto_salud, fecha
       FROM apuesta
       WHERE id_usuario = ?
       ORDER BY fecha DESC LIMIT 50`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) { return R.serverError(res, err); }
};

module.exports = { realizarApuesta, getHistorialApuestas };
