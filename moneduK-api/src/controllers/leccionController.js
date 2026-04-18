const { pool } = require('../config/db');
const R = require('../utils/response');

/**
 * GET /lecciones
 * Devuelve las lecciones disponibles para la edad del usuario, con su progreso.
 */
const getLecciones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id_leccion, l.titulo, l.descripcion, l.recompensa_koin,
              l.recompensa_xp, l.orden, c.nombre AS categoria,
              COALESCE(p.completada, 0) AS completada,
              p.puntaje_quiz
       FROM leccion l
       JOIN categoria_leccion c ON c.id_categoria = l.id_categoria
       LEFT JOIN progreso_leccion p
         ON p.id_leccion = l.id_leccion AND p.id_usuario = ?
       WHERE l.activa = 1
       ORDER BY l.orden ASC`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * GET /lecciones/:id
 * Detalle de una lección con sus preguntas de quiz.
 */
const getLeccion = async (req, res) => {
  try {
    const { id } = req.params;

    const [lecciones] = await pool.query(
      `SELECT l.*, c.nombre AS categoria FROM leccion l
       JOIN categoria_leccion c ON c.id_categoria = l.id_categoria
       WHERE l.id_leccion = ? AND l.activa = 1`,
      [id]
    );
    if (lecciones.length === 0) return R.notFound(res, 'Lección no encontrada');

    const [quizzes] = await pool.query(
      `SELECT id_quiz, pregunta, opcion_a, opcion_b, opcion_c, opcion_d
       FROM quiz WHERE id_leccion = ?`,
      [id]
    );

    return R.ok(res, { ...lecciones[0], quizzes });
  } catch (err) {
    return R.serverError(res, err);
  }
};

/**
 * POST /lecciones/:id/completar
 * Marca la lección como completada, entrega recompensas y actualiza la mascota.
 * Body: { puntaje_quiz: number (0-100) }
 */
const completarLeccion = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { puntaje_quiz = 100 } = req.body;
    const id_usuario = req.user.id_usuario;

    // Obtener lección
    const [lec] = await conn.query(
      'SELECT recompensa_koin, recompensa_xp FROM leccion WHERE id_leccion = ? AND activa = 1',
      [id]
    );
    if (lec.length === 0) return R.notFound(res, 'Lección no encontrada');

    // Verificar si ya fue completada
    const [progreso] = await conn.query(
      'SELECT completada FROM progreso_leccion WHERE id_usuario = ? AND id_leccion = ?',
      [id_usuario, id]
    );
    if (progreso.length > 0 && progreso[0].completada) {
      return R.badRequest(res, 'Esta lección ya fue completada');
    }

    const { recompensa_koin, recompensa_xp } = lec[0];

    await conn.beginTransaction();

    // 1. Insertar o actualizar progreso
    await conn.query(
      `INSERT INTO progreso_leccion (id_usuario, id_leccion, completada, puntaje_quiz, fecha_completado)
       VALUES (?, ?, 1, ?, NOW())
       ON DUPLICATE KEY UPDATE
         completada = 1, puntaje_quiz = VALUES(puntaje_quiz), fecha_completado = NOW()`,
      [id_usuario, id, puntaje_quiz]
    );

    // 2. Agregar KoinK a la wallet
    const [walletRows] = await conn.query(
      'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?',
      [id_usuario]
    );
    const { id_wallet, saldo } = walletRows[0];
    await conn.query(
      `UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?`,
      [recompensa_koin, recompensa_koin, id_wallet]
    );

    // 3. Registrar transacción tipo "leccion" (id_tipo = 6)
    await conn.query(
      `INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion)
       VALUES (?, 6, ?, ?)`,
      [id_wallet, recompensa_koin, `Recompensa lección #${id}`]
    );

    // 4. Aumentar XP y salud de la mascota (+5 salud por completar lección)
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
        'UPDATE mascota SET salud = ?, id_estado = ?, experiencia = experiencia + ? WHERE id_mascota = ?',
        [salud_nueva, estados[0]?.id_estado, recompensa_xp, id_mascota]
      );
      await conn.query(
        'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
        [id_mascota, salud, salud_nueva, `Completó lección #${id}`]
      );
    }

    await conn.commit();

    return R.ok(res, {
      recompensa_koin,
      recompensa_xp,
      saldo_nuevo: saldo + recompensa_koin,
    }, '¡Lección completada! 🎉');
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getLecciones, getLeccion, completarLeccion };
