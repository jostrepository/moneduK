const { aplicarXPySalud } = require('./mascotaHelper');

// Este disparador (trigger) automatiza el progreso de las misiones.
// Busca si el usuario tiene una misión activa del tipo enviado (ej. 'trabajo') 
// y le suma el incremento. Si la meta se alcanza, inyecta las recompensas.
const triggerMision = async (conn, id_usuario, tipoMision, incremento) => {
  const [rows] = await conn.query(
    `SELECT mu.id_mision 
     FROM mision_usuario mu
     JOIN mision m ON m.id_mision = mu.id_mision
     WHERE mu.id_usuario = ? AND m.tipo = ? AND mu.completada = 0 AND m.activa = 1
     LIMIT 1`,
    [id_usuario, tipoMision]
  );

  if (rows.length > 0) {
    const id_mision = rows[0].id_mision;
    
    const [mision] = await conn.query(
      `SELECT m.*, mu.progreso 
       FROM mision m
       JOIN mision_usuario mu ON mu.id_mision = m.id_mision
       WHERE m.id_mision = ? AND mu.id_usuario = ?`,
      [id_mision, id_usuario]
    );

    const m = mision[0];
    const progreso_nuevo = parseFloat(Math.min(Number(m.progreso) + Number(incremento), Number(m.meta_cantidad) || 9999).toFixed(2));
    const se_completa = m.meta_cantidad && progreso_nuevo >= Number(m.meta_cantidad);

    await conn.query(
      `UPDATE mision_usuario
       SET progreso = ?, completada = ?, fecha_completado = IF(?, NOW(), NULL)
       WHERE id_usuario = ? AND id_mision = ?`,
      [progreso_nuevo, se_completa ? 1 : 0, se_completa, id_usuario, id_mision]
    );

    // Si la misión acaba de alcanzar su meta, entregamos KoinKs, XP y Vida automáticamente.
    if (se_completa) {
      const [walletRows] = await conn.query('SELECT id_wallet FROM wallet WHERE id_usuario = ?', [id_usuario]);
      const { id_wallet } = walletRows[0];

      if (m.recompensa_koin > 0) {
        await conn.query(
          'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
          [m.recompensa_koin, m.recompensa_koin, id_wallet]
        );
        await conn.query(
          'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,7,?,?)',
          [id_wallet, m.recompensa_koin, `Misión completada: ${m.titulo}`]
        );
      }

      await aplicarXPySalud(conn, id_usuario, 1000, 100, 1, `Completó misión: ${m.titulo}`);
    }
  }
};

// Es VITAL esta línea al final, de lo contrario Node soltará Error 500 al intentar leerla.
module.exports = { triggerMision };