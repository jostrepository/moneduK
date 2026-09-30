const { pool } = require('../config/db');
const R = require('../utils/response');


// Recuperamos el catálogo de productos activos filtrando directamente la base de datos,
// uniendo su respectiva categoría para organizar adecuadamente la vista del cliente.

const getProductos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id_producto, p.nombre, p.descripcion,
          p.precio_koin, p.imagen_url,
          c.nombre AS categoria
      FROM producto p
      JOIN categoria_producto c ON c.id_cat_prod = p.id_cat_prod
      WHERE p.disponible = 1
      ORDER BY c.nombre, p.precio_koin ASC`
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};


// Procesamos la adquisición verificando numéricamente los fondos de la billetera,
// debitando el costo exacto y sumando la transacción al historial del usuario.

const comprarProducto = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id_producto } = req.body;
    const id_usuario = req.user.id_usuario;

    const [productos] = await conn.query(
      'SELECT * FROM producto WHERE id_producto = ? AND disponible = 1',
      [id_producto]
    );
    if (productos.length === 0) return R.notFound(res, 'Producto no encontrado');
    const producto = productos[0];

    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
      [id_usuario]
    );
    if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
    const { id_wallet, saldo } = walletRows[0];

    if (Number(saldo) < Number(producto.precio_koin)) {
      return R.badRequest(res, `Necesitas ${producto.precio_koin} KoinK. Tienes ${saldo}.`);
    }

    await conn.beginTransaction();

    const [compraResult] = await conn.query(
      'INSERT INTO compra (id_usuario, id_producto, precio_pagado, equipado) VALUES (?,?,?,0)',
      [id_usuario, id_producto, producto.precio_koin]
    );

    await conn.query(
      `UPDATE wallet SET saldo = saldo - ?, total_gastado = total_gastado + ?
      WHERE id_wallet = ?`,
      [Number(producto.precio_koin), Number(producto.precio_koin), id_wallet]
    );

    await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion)
      VALUES (?, 2, ?, ?)`,
      [id_wallet, producto.precio_koin, `Compra: ${producto.nombre}`]
    );

    await conn.commit();

    return R.created(res, {
      id_compra: compraResult.insertId,
      producto: producto.nombre,
      precio_koin: producto.precio_koin,
      saldo_nuevo: Number(saldo) - Number(producto.precio_koin),
    }, `¡Compraste "${producto.nombre}"! 🛍️`);
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};


// Extraemos la lista completa de accesorios que el usuario ha adquirido previamente,
// inyectando su estado de uso actual para gestionar los botones de equipamiento.

const getMisCompras = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
      c.id_compra, c.precio_pagado, c.fecha, c.equipado, c.id_producto,
      p.nombre, p.imagen_url,
      -- 👇 Traducimos el número a texto para que React Native lo entienda
      CASE WHEN p.id_cat_prod = 1 THEN 'Cabeza' ELSE 'Mano' END AS categoria
      FROM compra c
      INNER JOIN producto p ON c.id_producto = p.id_producto
      WHERE c.id_usuario = ?
      ORDER BY c.fecha DESC`,
    [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    console.error("Error en SQL:", err);
    return R.serverError(res, err);
  }
};


// Modificamos el estado del inventario para desmarcar objetos de la misma categoría,
// asegurando que el cerdito luzca únicamente el nuevo artículo seleccionado.

const equiparProducto = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id_compra, equipar } = req.body;
    const id_usuario = req.user.id_usuario;

    if (!equipar) {
      await conn.query('UPDATE compra SET equipado = 0 WHERE id_compra = ? AND id_usuario = ?', [id_compra, id_usuario]);
    } else {
      await conn.query(`
        UPDATE compra c
        JOIN producto p ON c.id_producto = p.id_producto
        JOIN producto p2 ON p2.id_cat_prod = p.id_cat_prod
        SET c.equipado = 0
        WHERE c.id_usuario = ? AND c.id_producto = p2.id_producto`,
      [id_usuario]);
      await conn.query('UPDATE compra SET equipado = 1 WHERE id_compra = ? AND id_usuario = ?', [id_compra, id_usuario]);
    }

    return R.ok(res, null, equipar ? '¡Artículo equipado! 🎩' : 'Artículo desequipado 🐷');
  } catch (err) {
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getProductos, comprarProducto, getMisCompras, equiparProducto };