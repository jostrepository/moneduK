const { pool }            = require('../config/db');
const R                   = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');

// ─── Tipos de inversión ───────────────────────────────────
const getTiposInversion = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tipo_inversion ORDER BY rendimiento_pct ASC');
    return R.ok(res, rows);
  } catch (err) { return R.serverError(res, err); }
};

// ─── Mis inversiones ──────────────────────────────────────
const getMisInversiones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.id_inversion, i.monto_invertido, i.rendimiento_esperado,
              i.fecha_inicio, i.fecha_vencimiento, i.estado,
              ti.nombre AS tipo, ti.rendimiento_pct,
              TIMESTAMPDIFF(MINUTE, NOW(), i.fecha_vencimiento) AS minutos_restantes
       FROM inversion i
       JOIN tipo_inversion ti ON ti.id_tipo_inv = i.id_tipo_inv
       WHERE i.id_usuario = ?
       ORDER BY i.fecha_inicio DESC`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) { return R.serverError(res, err); }
};

// ─── Verificar cooldown (8 horas desde la última inversión completada o activa) ──
const verificarCooldown = async (id_usuario) => {
  const [rows] = await pool.query(
    `SELECT fecha_inicio FROM inversion
     WHERE id_usuario = ? AND estado = 'activa'
     ORDER BY fecha_inicio DESC LIMIT 1`,
    [id_usuario]
  );
  if (rows.length === 0) return { enCooldown: false };

  const fechaUltima  = new Date(rows[0].fecha_inicio);
  const ahora        = new Date();
  const horasTranscurridas = (ahora - fechaUltima) / (1000 * 60 * 60);

  if (horasTranscurridas < 8) {
    const horasRestantes = Math.ceil(8 - horasTranscurridas);
    return { enCooldown: true, horasRestantes };
  }
  return { enCooldown: false };
};

// ─── Crear inversión ──────────────────────────────────────
/**
 * POST /inversiones
 * - Cooldown de 8 horas entre inversiones
 * - Rendimiento aleatorio entre 1% y 15% del monto
 * - Al cobrar: +100 XP y +20 salud (umbral 80)
 */
const crearInversion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id_tipo_inv, monto } = req.body;
    const id_usuario = req.user.id_usuario;

    // Verificar cooldown
    const cooldown = await verificarCooldown(id_usuario);
    if (cooldown.enCooldown) {
      return R.badRequest(
        res,
        `Debes esperar ${cooldown.horasRestantes} hora(s) antes de crear otra inversión.`
      );
    }

    // Obtener tipo
    const [tipos] = await conn.query('SELECT * FROM tipo_inversion WHERE id_tipo_inv = ?', [id_tipo_inv]);
    if (tipos.length === 0) return R.notFound(res, 'Tipo de inversión no encontrado');

    // Verificar saldo
    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];
    if (Number(saldo) < monto) return R.badRequest(res, 'Saldo insuficiente');

    // ── Rendimiento aleatorio entre 1% y 15% ──────────────
    const rendimiento_pct     = parseFloat((Math.random() * (15 - 1) + 1).toFixed(2));
    const rendimiento_esperado = parseFloat((monto * rendimiento_pct / 100).toFixed(2));

    // Vencimiento: 8 horas desde ahora
    const fecha_vencimiento = new Date(Date.now() + 8 * 60 * 60 * 1000);

    await conn.beginTransaction();

    // 1. Crear inversión
    const [invResult] = await conn.query(
      `INSERT INTO inversion
         (id_usuario, id_tipo_inv, monto_invertido, rendimiento_esperado, fecha_vencimiento)
       VALUES (?,?,?,?,?)`,
      [id_usuario, id_tipo_inv, monto, rendimiento_esperado, fecha_vencimiento]
    );

    // 2. Descontar saldo
    await conn.query(
      'UPDATE wallet SET saldo = saldo - ?, total_gastado = total_gastado + ? WHERE id_wallet = ?',
      [monto, monto, id_wallet]
    );

    // 3. Registrar transacción
    await conn.query(
      'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,4,?,?)',
      [id_wallet, monto, `Inversión en ${tipos[0].nombre} (${rendimiento_pct}% rendimiento)`]
    );

    await conn.commit();

    return R.created(res, {
      id_inversion:       invResult.insertId,
      monto_invertido:    monto,
      rendimiento_pct,
      rendimiento_esperado,
      fecha_vencimiento,
      saldo_nuevo:        Number(saldo) - monto,
      cooldown_horas:     8,
    }, `¡Inversión creada! Ganarás 🪙 ${rendimiento_esperado} KoinK (${rendimiento_pct}%) en 8 horas 📈`);
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

// ─── Cobrar inversión ─────────────────────────────────────
/**
 * POST /inversiones/:id/cobrar
 * Al cobrar: +100 XP y +20 salud (umbral 80 — si salud >= 80 se suma solo hasta 100)
 */
const cobrarInversion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id }     = req.params;
    const id_usuario = req.user.id_usuario;

    const [inversiones] = await conn.query(
      "SELECT * FROM inversion WHERE id_inversion = ? AND id_usuario = ? AND estado = 'activa'",
      [id, id_usuario]
    );
    if (inversiones.length === 0) return R.notFound(res, 'Inversión no encontrada o ya cobrada');

    const inv = inversiones[0];
    if (new Date() < new Date(inv.fecha_vencimiento)) {
      const min = Math.ceil((new Date(inv.fecha_vencimiento) - new Date()) / 60000);
      return R.badRequest(res, `La inversión aún no ha vencido. Faltan ${min} minutos.`);
    }

    const total_cobro = parseFloat(
      (Number(inv.monto_invertido) + Number(inv.rendimiento_esperado)).toFixed(2)
    );

    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
    );
    const { id_wallet, saldo } = walletRows[0];

    await conn.beginTransaction();

    // Marcar completada
    await conn.query(
      "UPDATE inversion SET estado = 'completada' WHERE id_inversion = ?", [id]
    );

    // Acreditar total
    await conn.query(
      'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
      [total_cobro, total_cobro, id_wallet]
    );

    // Transacción
    await conn.query(
      'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,4,?,?)',
      [id_wallet, total_cobro, `Cobro inversión #${id} + rendimiento`]
    );

    // +100 XP y +20 salud (umbral 80)
    const mascotaResult = await aplicarXPySalud(
      conn, id_usuario,
      100,   // XP
      20,    // salud delta
      80,    // umbral: si salud >= 80, ajusta hasta 100
      `Cobró inversión #${id}`
    );

    await conn.commit();

    return R.ok(res, {
      monto_invertido:  Number(inv.monto_invertido),
      rendimiento:      Number(inv.rendimiento_esperado),
      total_cobrado:    total_cobro,
      saldo_nuevo:      Number(saldo) + total_cobro,
      mascota:          mascotaResult,
      xp_ganado:        100,
      salud_ganada:     20,
    }, '¡Inversión cobrada con éxito! 🎉');
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getTiposInversion, getMisInversiones, crearInversion, cobrarInversion };
