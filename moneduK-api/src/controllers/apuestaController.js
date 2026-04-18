const { pool } = require('../config/db');
const R = require('../utils/response');

// Mensajes educativos aleatorios que se muestran al apostar
const LECCIONES_MORALES = [
  'Apostar es arriesgado: puedes perder todo lo que tienes. ¡El dinero se gana con esfuerzo!',
  'Los juegos de azar están diseñados para que la casa siempre gane. ¡Mejor ahorra ese dinero!',
  'Una persona que apuesta frecuentemente puede perder mucho más de lo que gana.',
  'En lugar de apostar, ¿qué tal invertir? Con inversiones tu dinero crece de forma segura.',
  'El dinero fácil casi nunca existe. Lo que se gana con trabajo vale mucho más.',
  '¿Sabías que muchas personas pierden sus ahorros apostando? ¡Cuida tu KoinK!',
];

/**
 * POST /apuestas
 * Registra una apuesta. Siempre daña la mascota independientemente del resultado.
 * Si el usuario gana, recibe algo de vuelta, pero la mascota sufre igual.
 * Body: { monto }
 */
const realizarApuesta = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { monto } = req.body;
    const id_usuario = req.user.id_usuario;

    // Verificar saldo suficiente
    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
      [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    if (saldo < monto) {
      return R.badRequest(res, 'No tienes suficiente KoinK para apostar');
    }

    // Resultado aleatorio: 35% de ganar (siempre desventaja para enseñar)
    const gano = Math.random() < 0.35;
    const resultado = gano ? 'ganó' : 'perdió';
    const monto_resultado = gano
      ? parseFloat((monto * 1.5).toFixed(2))   // gana 1.5x
      : 0;

    // Delta de saldo: pierde lo apostado, si ganó recupera el resultado
    const delta_saldo = gano
      ? monto_resultado - monto   // ganancia neta (puede ser positiva)
      : -monto;                   // pérdida total

    const saldo_nuevo = parseFloat((saldo + delta_saldo).toFixed(2));

    // Mensaje educativo aleatorio
    const leccion_moral = LECCIONES_MORALES[
      Math.floor(Math.random() * LECCIONES_MORALES.length)
    ];

    // Impacto en mascota: SIEMPRE negativo (-10 salud sin importar resultado)
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
       SET saldo        = saldo + ?,
           total_gastado = total_gastado + ?
       WHERE id_wallet = ?`,
      [delta_saldo, monto, id_wallet]
    );

    // 3. Registrar transacción tipo "apuesta" (id_tipo = 5, es_positivo = 0)
    await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion)
       VALUES (?, 5, ?, ?)`,
      [id_wallet, monto, `Apuesta — ${resultado}`]
    );

    // 4. Dañar mascota SIEMPRE (-10 salud)
    const [mascota] = await conn.query(
      'SELECT id_mascota, salud FROM mascota WHERE id_usuario = ?',
      [id_usuario]
    );
    let mascota_data = null;
    if (mascota.length > 0) {
      const { id_mascota, salud } = mascota[0];
      const salud_nueva = Math.max(0, salud + impacto_salud);
      const [estados] = await conn.query(
        'SELECT id_estado FROM estado_mascota WHERE ? BETWEEN rango_salud_min AND rango_salud_max LIMIT 1',
        [salud_nueva]
      );
      await conn.query(
        'UPDATE mascota SET salud = ?, id_estado = ? WHERE id_mascota = ?',
        [salud_nueva, estados[0]?.id_estado, id_mascota]
      );
      await conn.query(
        'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
        [id_mascota, salud, salud_nueva, 'Realizó una apuesta']
      );
      mascota_data = { salud_anterior: salud, salud_nueva };
    }

    await conn.commit();

    return R.ok(res, {
      resultado,
      monto_apostado:  monto,
      monto_resultado,
      delta_saldo,
      saldo_nuevo,
      mascota:         mascota_data,
      leccion_moral,   // ← siempre se muestra en la app
      advertencia:     '⚠️ Apostar siempre daña a tu mascota, aunque ganes.',
    }, gano ? '¡Ganaste esta vez... pero tu cerdito sufrió! 😟' : 'Perdiste la apuesta y tu cerdito está triste 😢');
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

/**
 * GET /apuestas/historial
 */
const getHistorialApuestas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT monto_apostado, resultado, monto_resultado,
              leccion_moral, impacto_salud, fecha
       FROM apuesta
       WHERE id_usuario = ?
       ORDER BY fecha DESC
       LIMIT 50`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

module.exports = { realizarApuesta, getHistorialApuestas };
