const { pool } = require('../config/db');
const R = require('../utils/response');
const { triggerMision } = require('../utils/misionHelper');


// Extraemos el panorama completo de la billetera digital vinculada al usuario,
// exponiendo su liquidez y el acumulado histórico de flujos para el frontend.

const getMiWallet = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT saldo, total_ganado, total_gastado, fecha_actualizacion
      FROM wallet WHERE id_usuario = ?`,
      [req.user.id_usuario]
    );
    if (rows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    return R.ok(res, rows[0]);
  } catch (err) {
    return R.serverError(res, err);
  }
};


// Configuramos la paginación dinámica del historial imponiendo un límite de seguridad,
// trazando el recorrido financiero del usuario cruzando la tabla pivote de tipos.

const getTransacciones = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit)  || 20, 100);
    const offset = Number(req.query.offset) || 0;

    const [rows] = await pool.query(
      `SELECT t.id_transaccion, t.monto, t.descripcion, t.fecha,
          tt.nombre AS tipo, tt.es_positivo
      FROM transaccion t
      JOIN wallet w ON w.id_wallet = t.id_wallet
      JOIN tipo_transaccion tt ON tt.id_tipo = t.id_tipo
      WHERE w.id_usuario = ?
      ORDER BY t.fecha DESC
      LIMIT ? OFFSET ?`,
      [req.user.id_usuario, limit, offset]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};


// Disparamos la actualización oculta de la misión vinculada al tipo de transacción económica,
// ya sea un ingreso por trabajos o un registro de gastos, alterando la billetera al mismo tiempo.

const registrarTransaccion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id_tipo, monto, descripcion = '' } = req.body;
    const id_usuario = req.user.id_usuario;

    const [walletRows] = await conn.query('SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]);
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');

    const { id_wallet, saldo } = walletRows[0];

    const [tipoRows] = await conn.query('SELECT es_positivo FROM tipo_transaccion WHERE id_tipo = ?', [id_tipo]);
    if (tipoRows.length === 0) return R.badRequest(res, 'Tipo de transacción inválido');

    const { es_positivo } = tipoRows[0];
    const delta = es_positivo ? Math.abs(monto) : -Math.abs(monto);
    const saldo_nuevo = saldo + delta;

    if (saldo_nuevo < 0) return R.badRequest(res, 'Saldo insuficiente');

    await conn.beginTransaction();

    const [txResult] = await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?, ?, ?, ?)`,
      [id_wallet, id_tipo, Math.abs(monto), descripcion]
    );

    await conn.query(
      `UPDATE wallet SET saldo = ?, total_ganado = total_ganado + IF(? > 0, ?, 0), total_gastado = total_gastado + IF(? < 0, ?, 0) WHERE id_wallet = ?`,
      [saldo_nuevo, delta, Math.abs(delta), delta, Math.abs(delta), id_wallet]
    );

    const tipoMision = es_positivo ? 'trabajo' : 'gasto';
    await triggerMision(conn, id_usuario, tipoMision, Math.abs(monto));

    await conn.commit();

    return R.created(res, { id_transaccion: txResult.insertId, saldo_nuevo }, 'Transacción registrada');
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getMiWallet, getTransacciones, registrarTransaccion };