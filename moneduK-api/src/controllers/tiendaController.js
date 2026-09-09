const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * GET /tienda
 * Lista todos los productos disponibles agrupados por categoría.
 */

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

/**
 * POST /tienda/comprar
 * Compra un producto. Descuenta KoinK y registra la compra.
 * Body: { id_producto }
 */

    const comprarProducto = async (req, res) => {
      const conn = await pool.getConnection();
      try {
        const { id_producto } = req.body;
        const id_usuario = req.user.id_usuario;

    // Verificar que el producto existe

        const [productos] = await conn.query(
          'SELECT * FROM producto WHERE id_producto = ? AND disponible = 1',
          [id_producto]
        );
        if (productos.length === 0) return R.notFound(res, 'Producto no encontrado');
        const producto = productos[0];

    // Verificar saldo

        const [walletRows] = await conn.query(
          'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
          [id_usuario]
        );
        if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
        const { id_wallet, saldo } = walletRows[0];

        if (saldo < producto.precio_koin) {
          return R.badRequest(res, `Necesitas ${producto.precio_koin} KoinK. Tienes ${saldo}.`);
        }

        await conn.beginTransaction();

    // 1. Registrar compra

        const [compraResult] = await conn.query(
          'INSERT INTO compra (id_usuario, id_producto, precio_pagado) VALUES (?,?,?)',
          [id_usuario, id_producto, producto.precio_koin]
        );

    // 2. Descontar saldo

        await conn.query(
          `UPDATE wallet SET saldo = saldo - ?, total_gastado = total_gastado + ?
          WHERE id_wallet = ?`,
          [producto.precio_koin, producto.precio_koin, id_wallet]
        );

    // 3. Registrar transacción tipo gasto (id_tipo = 2)

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
          saldo_nuevo: saldo - producto.precio_koin,
        }, `¡Compraste "${producto.nombre}"! 🛍️`);
      } catch (err) {
        await conn.rollback();
        return R.serverError(res, err);
      } finally {
        conn.release();
      }
  };

/**
 * GET /tienda/mis-compras
 * Historial de compras del usuario.
 */

      const getMisCompras = async (req, res) => {
        try {
          const [rows] = await pool.query(
            `SELECT c.id_compra, c.precio_pagado, c.fecha,
              p.nombre AS producto, p.imagen_url,
              cat.nombre AS categoria
          FROM compra c
          JOIN producto p ON p.id_producto = c.id_producto
          JOIN categoria_producto cat ON cat.id_cat_prod = p.id_cat_prod
          WHERE c.id_usuario = ?
          ORDER BY c.fecha DESC`,
          [req.user.id_usuario]
        );
        return R.ok(res, rows);
      } catch (err) {
        return R.serverError(res, err);
      }
  };

  module.exports = { getProductos, comprarProducto, getMisCompras };
