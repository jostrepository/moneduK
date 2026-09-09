const { pool } = require('../config/db');

/**
 * Aplica XP y salud al cerdito del usuario con las reglas de negocio:
 * - Salud: si está al máximo (100) no se suma. Si está en el umbral, se suman solo los restantes.
 * - XP: se suma siempre sin límite.
 *
 * @param conn Conexión activa de MySQL (para usar dentro de una transacción)
 * @param id_usuario ID del usuario
 * @param xp XP a sumar
 * @param salud_delta Puntos de salud a sumar (puede ser negativo)
 * @param umbral Umbral a partir del cual se ajusta la salud (ej: 80, 95, 1). Default 100.
 * @param motivo Texto para el historial
 */

    async function aplicarXPySalud(conn, id_usuario, xp, salud_delta, umbral = 100, motivo = '') {
      const [rows] = await conn.query(
        'SELECT id_mascota, salud, experiencia FROM mascota WHERE id_usuario = ?',
        [id_usuario]
      );
      if (rows.length === 0) return null;

      const { id_mascota, salud, experiencia } = rows[0];

  // Calcular nueva salud 

     let salud_nueva = salud;

      if (salud_delta > 0) {
        if (salud >= 100) {

      // Cerdito al máximo → no sumar nada

          salud_nueva = 100;
        } else if (salud >= umbral) {

      // Por encima del umbral → sumar solo los puntos restantes hasta 100

          salud_nueva = 100;
        } else {
          salud_nueva = Math.min(100, salud + salud_delta);
        }
      } else if (salud_delta < 0) {

    // Daño: siempre se aplica, mínimo 0

        salud_nueva = Math.max(0, salud + salud_delta);
      }

  // Determinar nuevo estado 

  const [estados] = await conn.query(
        'SELECT id_estado FROM estado_mascota WHERE ? BETWEEN rango_salud_min AND rango_salud_max LIMIT 1',
        [salud_nueva]
      );
      const id_estado = estados[0]?.id_estado || 1;

  // Calcular nueva experiencia
      const experiencia_nueva = experiencia + xp;

  // Actualizar mascota 

      await conn.query(
        'UPDATE mascota SET salud = ?, id_estado = ?, experiencia = ? WHERE id_mascota = ?',
        [salud_nueva, id_estado, experiencia_nueva, id_mascota]
      );

  // Historial solo si la salud cambió

      if (salud_nueva !== salud) {
        await conn.query(
          'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
          [id_mascota, salud, salud_nueva, motivo]
        );
      }

      return { salud_anterior: salud, salud_nueva, experiencia_nueva };
  }

  module.exports = { aplicarXPySalud };
