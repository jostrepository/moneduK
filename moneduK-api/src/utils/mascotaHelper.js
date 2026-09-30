const { pool } = require('../config/db');


    // Recuperamos el estado vital y la experiencia actual de la mascota del usuario
    // para establecer la línea base sobre la cual calcularemos los nuevos atributos.

    async function aplicarXPySalud(conn, id_usuario, xp, salud_delta, umbral = 100, motivo = '') {
      const [rows] = await conn.query(
        'SELECT id_mascota, salud, experiencia FROM mascota WHERE id_usuario = ?',
        [id_usuario]
      );
      if (rows.length === 0) return null;

      const { id_mascota, salud, experiencia } = rows[0];


      // Computamos la variación de la salud aplicando un sistema de umbrales dinámicos
      // que previene que los ítems curativos desborden la vida máxima de la mascota.

     let salud_nueva = salud;

      if (salud_delta > 0) {
        if (salud >= 100) {
          salud_nueva = 100;
        } else if (salud >= umbral) {
          salud_nueva = 100;
        } else {
          salud_nueva = Math.min(100, salud + salud_delta);
        }
      } else if (salud_delta < 0) {
        salud_nueva = Math.max(0, salud + salud_delta);
      }


      // Contrastamos el nuevo nivel de salud contra los rangos predefinidos del sistema
      // para mutar automáticamente el estado emocional y la apariencia del cerdito.

  const [estados] = await conn.query(
        'SELECT id_estado FROM estado_mascota WHERE ? BETWEEN rango_salud_min AND rango_salud_max LIMIT 1',
        [salud_nueva]
      );
      const id_estado = estados[0]?.id_estado || 1;


      // Consolidamos la ganancia de experiencia sumando el puntaje recién adquirido
      // preparándolo para la escritura final en la base de datos de la aplicación.

      const experiencia_nueva = experiencia + xp;


      // Escribimos los valores definitivos de vitalidad, estado y experiencia acumulada
      // asegurando la persistencia del crecimiento de la mascota en el motor relacional.

      await conn.query(
        'UPDATE mascota SET salud = ?, id_estado = ?, experiencia = ? WHERE id_mascota = ?',
        [salud_nueva, id_estado, experiencia_nueva, id_mascota]
      );


      // Sellamos un registro de auditoría únicamente si hubo un cambio real en la salud
      // documentando el motivo exacto para alimentar el historial de la interfaz móvil.

      if (salud_nueva !== salud) {
        await conn.query(
          'INSERT INTO historial_mascota (id_mascota, salud_anterior, salud_nueva, motivo) VALUES (?,?,?,?)',
          [id_mascota, salud, salud_nueva, motivo]
        );
      }

      return { salud_anterior: salud, salud_nueva, experiencia_nueva };
  }

  module.exports = { aplicarXPySalud };