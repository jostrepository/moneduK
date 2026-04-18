const { pool } = require('../config/db');
const R = require('../utils/response');

// ─── Obtener mascota del usuario ──────────────────────────────────────────────

/**
 * GET /mascota
 * Devuelve la mascota del usuario autenticado con su estado actual.
 */
const getMiMascota = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id_mascota, m.nombre, m.nivel, m.salud, m.experiencia,
              m.fecha_creacion, m.fecha_actualizacion,
              e.nombre AS estado, e.descripcion AS estado_descripcion, e.icono_url
       FROM mascota m
       JOIN estado_mascota e ON e.id_estado = m.id_estado
       WHERE m.id_usuario = ?`,
      [req.user.id_usuario]
    );

    if (rows.length === 0) return R.notFound(res, 'Mascota no encontrada');

    return R.ok(res, rows[0]);
  } catch (err) {
    return R.serverError(res, err);
  }
};

// ─── Aplicar impacto a la mascota ────────────────────────────────────────────

/**
 * PATCH /mascota/impacto
 * Modifica la salud de la mascota basado en una acción del usuario.
 * Body: { delta: number, motivo: string }
 *   delta positivo  → buena decisión (ahorro, lección completada, etc.)
 *   delta negativo  → mala decisión (apuesta, gasto excesivo, etc.)
 */
const aplicarImpacto = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { delta, motivo = '' } = req.body;

    // Obtener mascota actual
    const [rows] = await conn.query(
      'SELECT id_mascota, salud FROM mascota WHERE id_usuario = ?',
      [req.user.id_usuario]
    );
    if (rows.length === 0) return R.notFound(res, 'Mascota no encontrada');

    const { id_mascota, salud } = rows[0];

    // Calcular nueva salud (clamp 0–100)
    const salud_nueva = Math.max(0, Math.min(100, salud + Number(delta)));

    // Determinar nuevo estado según rangos de la tabla estado_mascota
    const [estados] = await conn.query(
      `SELECT id_estado FROM estado_mascota
       WHERE ? BETWEEN rango_salud_min AND rango_salud_max
       LIMIT 1`,
      [salud_nueva]
    );
    const id_estado_nuevo = estados[0]?.id_estado || 1;

    await conn.beginTransaction();

    // Actualizar mascota
    await conn.query(
      `UPDATE mascota
       SET salud = ?, id_estado = ?,
           experiencia = experiencia + IF(? > 0, ?, 0)
       WHERE id_mascota = ?`,
      [salud_nueva, id_estado_nuevo, delta, Math.abs(delta), id_mascota]
    );

    // Registrar en historial
    await conn.query(
      `INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo)
       VALUES (?, ?, ?, ?)`,
      [id_mascota, salud, salud_nueva, motivo]
    );

    await conn.commit();

    return R.ok(res, { salud_anterior: salud, salud_nueva, id_estado_nuevo }, 'Impacto aplicado');
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

// ─── Renombrar mascota ────────────────────────────────────────────────────────

/**
 * PATCH /mascota/nombre
 * Body: { nombre: string }
 */
const renombrarMascota = async (req, res) => {
  try {
    const { nombre } = req.body;
    const [result] = await pool.query(
      'UPDATE mascota SET nombre = ? WHERE id_usuario = ?',
      [nombre, req.user.id_usuario]
    );
    if (result.affectedRows === 0) return R.notFound(res, 'Mascota no encontrada');
    return R.ok(res, { nombre }, 'Nombre actualizado');
  } catch (err) {
    return R.serverError(res, err);
  }
};

// ─── Historial de salud ───────────────────────────────────────────────────────

/**
 * GET /mascota/historial
 */
const getHistorial = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.salud_anterior, h.salud_nueva, h.motivo, h.fecha
       FROM historial_mascota h
       JOIN mascota m ON m.id_mascota = h.id_mascota
       WHERE m.id_usuario = ?
       ORDER BY h.fecha DESC
       LIMIT 50`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

module.exports = { getMiMascota, aplicarImpacto, renombrarMascota, getHistorial };
