const { pool } = require('../config/db');
const R = require('../utils/response');

// Obtener mascota del usuario

/**
 * GET /mascota
 * Devuelve la mascota del usuario autenticado con su estado actual.
 */


// Extraemos los artículos marcados como 'equipados' junto a las estadísticas de la mascota
// para inyectarlos en la respuesta y permitir que el frontend dibuje las modificaciones visuales.

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

    const mascota = rows[0];

    const [articulosEquipados] = await pool.query(
      `SELECT p.imagen_url, cat.nombre AS categoria
      FROM compra c
      JOIN producto p ON p.id_producto = c.id_producto
      JOIN categoria_producto cat ON cat.id_cat_prod = p.id_cat_prod
      WHERE c.id_usuario = ? AND c.equipado = 1`,
      [req.user.id_usuario]
    );

    mascota.articulosEquipados = articulosEquipados;

    return R.ok(res, mascota);
  } catch (err) {
    return R.serverError(res, err);
  }
};


  // Aplicar impacto a la mascota 

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

        // Comprobamos la existencia del registro en la base de datos
        // y aislamos su métrica de vitalidad previa para iniciar los cálculos.
        const [rows] = await conn.query(
          'SELECT id_mascota, salud FROM mascota WHERE id_usuario = ?',
          [req.user.id_usuario]
        );
        if (rows.length === 0) return R.notFound(res, 'Mascota no encontrada');

        const { id_mascota, salud } = rows[0];

        // Calcular nueva salud (clamp 0–100)
        // Imponemos límites matemáticos absolutos para evitar variables corruptas
        // asegurando que la barra de vida nunca desborde sus parámetros de renderizado.
        const salud_nueva = Math.max(0, Math.min(100, salud + Number(delta)));

        // Determinar nuevo estado según rangos de la tabla estado_mascota
        // Cruzamos la cifra depurada contra los umbrales dinámicos preestablecidos
        // para mutar automáticamente el comportamiento o apariencia del personaje si es necesario.
        const [estados] = await conn.query(
          `SELECT id_estado FROM estado_mascota
          WHERE ? BETWEEN rango_salud_min AND rango_salud_max
          LIMIT 1`,
          [salud_nueva]
        );
        const id_estado_nuevo = estados[0]?.id_estado || 1;

        await conn.beginTransaction();

    // Actualizar mascota
        // Escribimos los nuevos atributos en la matriz principal de la entidad
        // sumando experiencia condicionalmente sólo si el estímulo originario fue positivo.
        await conn.query(
          `UPDATE mascota
          SET salud = ?, id_estado = ?,
              experiencia = experiencia + IF(? > 0, ?, 0)
          WHERE id_mascota = ?`,
          [salud_nueva, id_estado_nuevo, delta, Math.abs(delta), id_mascota]
        );

    // Registrar en historial
        // Almacenamos un backup inmutable de la transición y su catalizador
        // permitiendo reconstruir la línea de tiempo de la evolución del cerdito.
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

  // Renombrar mascot

/**
 * PATCH /mascota/nombre
 * Body: { nombre: string }
 */

    const renombrarMascota = async (req, res) => {
      try {
        // Sustituimos el alias cosmético de la entidad en la base de datos
        // sin alterar su identificador serial para no quebrar las uniones relacionales.
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

// Historial de salud

/**
 * GET /mascota/historial
 */

    const getHistorial = async (req, res) => {
      try {
        // Extraemos un tope fijo de las últimas transiciones vitales registradas
        // facilitando el renderizado de la gráfica de bienestar en el dashboard del cliente.
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