const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * GET /inversiones/tipos
 * Lista los tipos de inversión disponibles.
 */
const getTiposInversion = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tipo_inversion ORDER BY rendimiento_pct ASC'
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * GET /inversiones
 * Inversiones activas y completadas del usuario.
 */
const getMisInversiones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id_inversion, i.monto_invertido, i.rendimiento_esperado,
              i.fecha_inicio, i.fecha_vencimiento, i.estado,
              ti.nombre AS tipo, ti.rendimiento_pct,
              TIMESTAMPDIFF(HOUR, NOW(), i.fecha_vencimiento) AS horas_restantes
       FROM inversion i
       JOIN tipo_inversion ti ON ti.id_tipo_inv = i.id_tipo_inv
       WHERE i.id_usuario = ?
       ORDER BY i.fecha_inicio DESC`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * POST /inversiones
 * Crea una nueva inversión. Descuenta el monto del wallet inmediatamente.
 * Body: { id_tipo_inv, monto }
 */
const crearInversion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id_tipo_inv, monto } = req.body;
    const id_usuario = req.user.id_usuario;

    // Obtener tipo de inversión
    const [tipos] = await conn.query(
      'SELECT * FROM tipo_inversion WHERE id_tipo_inv = ?',
      [id_tipo_inv]
    );
    if (tipos.length === 0) return R.notFound(res, 'Tipo de inversión no encontrado');
    const tipo = tipos[0];

    // Verificar saldo
    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
      [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    if (saldo < monto) {
      return R.badRequest(res, 'Saldo insuficiente para esta inversión');
    }

    // Calcular rendimiento y fecha de vencimiento (24 horas para el MVP)
    const rendimiento_esperado = parseFloat((monto * (tipo.rendimiento_pct / 100)).toFixed(2));
    const fecha_vencimiento = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    await conn.beginTransaction();

    // 1. Crear inversión
    const [invResult] = await conn.query(
      `INSERT INTO inversion
         (id_usuario, id_tipo_inv, monto_invertido, rendimiento_esperado, fecha_vencimiento)
       VALUES (?,?,?,?,?)`,
      [id_usuario, id_tipo_inv, monto, rendimiento_esperado, fecha_vencimiento]
    );

    // 2. Descontar saldo del wallet
    await conn.query(
      `UPDATE wallet SET saldo = saldo - ?, total_gastado = total_gastado + ?
       WHERE id_wallet = ?`,
      [monto, monto, id_wallet]
    );

    // 3. Registrar transacción tipo "inversion" (id_tipo = 4)
    await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion)
       VALUES (?, 4, ?, ?)`,
      [id_wallet, monto, `Inversión en ${tipo.nombre}`]
    );

    // 4. Impacto positivo en mascota (+5 salud por invertir)
    const [mascota] = await conn.query(
      'SELECT id_mascota, salud FROM mascota WHERE id_usuario = ?',
      [id_usuario]
    );
    if (mascota.length > 0) {
      const { id_mascota, salud } = mascota[0];
      const salud_nueva = Math.min(100, salud + 5);
      const [estados] = await conn.query(
        'SELECT id_estado FROM estado_mascota WHERE ? BETWEEN rango_salud_min AND rango_salud_max LIMIT 1',
        [salud_nueva]
      );
      await conn.query(
        'UPDATE mascota SET salud = ?, id_estado = ?, experiencia = experiencia + 15 WHERE id_mascota = ?',
        [salud_nueva, estados[0]?.id_estado, id_mascota]
      );
      await conn.query(
        'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
        [id_mascota, salud, salud_nueva, `Creó inversión en ${tipo.nombre}`]
      );
    }

    await conn.commit();

    return R.created(res, {
      id_inversion: invResult.insertId,
      monto_invertido: monto,
      rendimiento_esperado,
      fecha_vencimiento,
      saldo_nuevo: saldo - monto,
    }, `¡Inversión creada! Recibirás ${rendimiento_esperado} KoinK de ganancia en 24h 📈`);
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

/**
 * POST /inversiones/:id/cobrar
 * Cobra una inversión vencida. Acredita monto + rendimiento al wallet.
 */
const cobrarInversion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;

    const [inversiones] = await conn.query(
      `SELECT * FROM inversion
       WHERE id_inversion = ? AND id_usuario = ? AND estado = 'activa'`,
      [id, id_usuario]
    );
    if (inversiones.length === 0) {
      return R.notFound(res, 'Inversión no encontrada o ya fue cobrada');
    }

    const inv = inversiones[0];

    if (new Date() < new Date(inv.fecha_vencimiento)) {
      const horas = Math.ceil(
        (new Date(inv.fecha_vencimiento) - new Date()) / (1000 * 60 * 60)
      );
      return R.badRequest(res, `La inversión aún no ha vencido. Faltan ${horas} horas.`);
    }

    const total_cobro = parseFloat((inv.monto_invertido + inv.rendimiento_esperado).toFixed(2));

    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
      [id_usuario]
    );
    const { id_wallet, saldo } = walletRows[0];

    await conn.beginTransaction();

    // Marcar inversión como completada
    await conn.query(
      "UPDATE inversion SET estado = 'completada' WHERE id_inversion = ?",
      [id]
    );

    // Acreditar total al wallet
    await conn.query(
      `UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ?
       WHERE id_wallet = ?`,
      [total_cobro, total_cobro, id_wallet]
    );

    // Registrar transacción
    await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion)
       VALUES (?, 4, ?, ?)`,
      [id_wallet, total_cobro, `Cobro inversión #${id} + rendimiento`]
    );

    await conn.commit();

    return R.ok(res, {
      monto_invertido:     inv.monto_invertido,
      rendimiento:         inv.rendimiento_esperado,
      total_cobrado:       total_cobro,
      saldo_nuevo:         saldo + total_cobro,
    }, '¡Inversión cobrada con éxito! 🎉');
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getTiposInversion, getMisInversiones, crearInversion, cobrarInversion };
