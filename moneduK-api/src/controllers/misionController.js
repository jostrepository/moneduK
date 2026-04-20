const { pool }            = require('../config/db');
const R                   = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');

// ─── Listar misiones ──────────────────────────────────────
/**
 * GET /misiones
 * Incluye estado de cooldown semanal para misiones ya completadas.
 */
const getMisiones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.id_mision, m.titulo, m.descripcion, m.tipo,
              m.meta_cantidad, m.recompensa_koin,
              1000  AS recompensa_xp,
              100   AS recompensa_salud,
              m.duracion_dias,
              COALESCE(mu.progreso, 0)   AS progreso,
              COALESCE(mu.completada, 0) AS completada,
              mu.fecha_asignacion,
              mu.fecha_completado,
              -- Cooldown semanal: disponible de nuevo 7 días después de completada
              CASE
                WHEN mu.completada = 1
                     AND mu.fecha_completado IS NOT NULL
                     AND TIMESTAMPDIFF(DAY, mu.fecha_completado, NOW()) < 7
                THEN 1 ELSE 0
              END AS en_cooldown,
              CASE
                WHEN mu.completada = 1 AND mu.fecha_completado IS NOT NULL
                THEN GREATEST(0, 7 - TIMESTAMPDIFF(DAY, mu.fecha_completado, NOW()))
                ELSE 0
              END AS dias_para_renovar
       FROM mision m
       LEFT JOIN mision_usuario mu
         ON mu.id_mision = m.id_mision AND mu.id_usuario = ?
       WHERE m.activa = 1
       ORDER BY mu.completada ASC, m.id_mision ASC`,
      [req.user.id_usuario]
    );
    return R.ok(res, rows);
  } catch (err) { return R.serverError(res, err); }
};

// ─── Iniciar misión ───────────────────────────────────────
/**
 * POST /misiones/:id/iniciar
 * Si la misión fue completada hace más de 7 días, se reinicia el progreso.
 */
const iniciarMision = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id }     = req.params;
    const id_usuario = req.user.id_usuario;

    const [mision] = await conn.query(
      'SELECT * FROM mision WHERE id_mision = ? AND activa = 1', [id]
    );
    if (mision.length === 0) return R.notFound(res, 'Misión no encontrada');

    const [existente] = await conn.query(
      'SELECT * FROM mision_usuario WHERE id_usuario = ? AND id_mision = ?',
      [id_usuario, id]
    );

    if (existente.length > 0) {
      const mu = existente[0];

      // Si está en cooldown activo, no se puede reiniciar
      if (mu.completada && mu.fecha_completado) {
        const diasTranscurridos = (Date.now() - new Date(mu.fecha_completado).getTime()) / (1000 * 60 * 60 * 24);
        if (diasTranscurridos < 7) {
          const diasRestantes = Math.ceil(7 - diasTranscurridos);
          return R.badRequest(res, `Esta misión se renueva en ${diasRestantes} día(s).`);
        }
        // Han pasado 7+ días → reiniciar la misión
        await conn.query(
          `UPDATE mision_usuario
           SET progreso = 0, completada = 0, fecha_asignacion = NOW(), fecha_completado = NULL
           WHERE id_usuario = ? AND id_mision = ?`,
          [id_usuario, id]
        );
        return R.ok(res, null, `¡Misión "${mision[0].titulo}" renovada! 🎯`);
      }

      // Ya está en progreso
      return R.conflict(res, 'Ya iniciaste esta misión');
    }

    // Primera vez
    await conn.query(
      'INSERT INTO mision_usuario (id_usuario, id_mision) VALUES (?,?)',
      [id_usuario, id]
    );

    conn.release();
    return R.created(res, null, `¡Misión "${mision[0].titulo}" iniciada! 🎯`);
  } catch (err) {
    conn.release();
    return R.serverError(res, err);
  }
};

// ─── Actualizar progreso ──────────────────────────────────
/**
 * PATCH /misiones/:id/progreso
 * Al completar: +1000 XP y +100 salud (umbral 1 — siempre se suman puntos restantes).
 * Cooldown semanal se gestiona desde iniciarMision.
 */
const actualizarProgreso = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id }       = req.params;
    const { incremento } = req.body;
    const id_usuario   = req.user.id_usuario;

    const [rows] = await conn.query(
      `SELECT m.*, mu.progreso, mu.completada
       FROM mision m
       JOIN mision_usuario mu ON mu.id_mision = m.id_mision
       WHERE m.id_mision = ? AND mu.id_usuario = ?`,
      [id, id_usuario]
    );
    if (rows.length === 0) return R.notFound(res, 'Misión no iniciada');

    const mision = rows[0];
    if (mision.completada) return R.badRequest(res, 'Esta misión ya fue completada');

    const progreso_nuevo = parseFloat(
      Math.min(mision.progreso + incremento, mision.meta_cantidad || 9999).toFixed(2)
    );
    const se_completa = mision.meta_cantidad && progreso_nuevo >= mision.meta_cantidad;

    await conn.beginTransaction();

    await conn.query(
      `UPDATE mision_usuario
       SET progreso = ?,
           completada = ?,
           fecha_completado = IF(?, NOW(), NULL)
       WHERE id_usuario = ? AND id_mision = ?`,
      [progreso_nuevo, se_completa ? 1 : 0, se_completa, id_usuario, id]
    );

    let recompensas = null;

    if (se_completa) {
      // ── Entregar KoinK ────────────────────────────────
      const [walletRows] = await conn.query(
        'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
      );
      const { id_wallet, saldo } = walletRows[0];

      if (mision.recompensa_koin > 0) {
        await conn.query(
          'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
          [mision.recompensa_koin, mision.recompensa_koin, id_wallet]
        );
        await conn.query(
          'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,7,?,?)',
          [id_wallet, mision.recompensa_koin, `Misión completada: ${mision.titulo}`]
        );
      }

      // ── +1000 XP y +100 salud (umbral 1) ─────────────
      // umbral = 1: si salud >= 1, se ajusta hasta 100 sumando los restantes
      const mascotaResult = await aplicarXPySalud(
        conn, id_usuario,
        1000,  // XP
        100,   // salud delta
        1,     // umbral: desde 1 HP ya se aplica el ajuste
        `Completó misión: ${mision.titulo}`
      );

      recompensas = {
        koin:        mision.recompensa_koin,
        xp:          1000,
        salud:       100,
        saldo_nuevo: Number(saldo) + mision.recompensa_koin,
        mascota:     mascotaResult,
        cooldown_dias: 7,
      };
    }

    await conn.commit();

    return R.ok(res, {
      progreso_nuevo,
      completada: se_completa,
      recompensas,
    }, se_completa
      ? `¡Misión "${mision.titulo}" completada! 🏆 Se renueva en 7 días.`
      : 'Progreso actualizado'
    );
  } catch (err) {
    await conn.rollback();
    return R.serverError(res, err);
  } finally {
    conn.release();
  }
};

module.exports = { getMisiones, iniciarMision, actualizarProgreso };
