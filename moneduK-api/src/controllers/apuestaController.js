const { pool } = require('../config/db');
const R = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');

const LECCIONES_MORALES = [
  'Apostar es arriesgado: puedes perder todo lo que tienes. ¡El dinero se gana con esfuerzo!',
  'Los juegos de azar están diseñados para que la casa siempre gane. ¡Mejor ahorra ese dinero!',
  'Una persona que apuesta frecuentemente puede perder mucho más de lo que gana.',
  'En lugar de apostar, ¿qué tal invertir? Con inversiones tu dinero crece de forma segura.',
  'El dinero fácil casi nunca existe. Lo que se gana con trabajo vale mucho más.',
  '¿Sabías que muchas personas pierden sus ahorros apostando? ¡Cuida tu KoinK!',
];

// Realizar una apuesta
/**
 * POST /apuestas
 * Reglas:
  * - 25% probabilidad de DUPLICAR la apuesta (ganar el monto apostado)
  * - 75% probabilidad de PERDER lo apostado
  * - SIEMPRE -10 HP al cerdito (sin importar el resultado)
  * - NO genera XP
 */

const realizarApuesta = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { monto } = req.body;
    const id_usuario = req.user.id_usuario;


    // Verificar saldo

      // Interceptamos la cuenta del usuario para extraer el identificador y el efectivo
      // garantizando que no inicie el juego con dinero ficticio o deudas no soportadas.

      const [walletRows] = await conn.query(
         'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
        );
        if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
        const { id_wallet, saldo } = walletRows[0];

        if (Number(saldo) < monto) {
          return R.badRequest(res, 'No tienes suficiente KoinK para apostar');
      }


    // 25% probabilidad de ganar / 75% probabilidad de perder 

        // Evaluamos el azar usando la función nativa contra la constante de probabilidad
        // marcando el veredicto en lenguaje natural para inyectarlo en el historial.

        const gano = Math.random() < 0.25;
        const resultado = gano ? 'ganó' : 'perdió';


    // Si gana: recibe el doble (monto apostado * 2)
    // Si pierde: recibe 0

      // Calculamos la liquidación bruta doblando el dinero solo si el azar fue favorable
      // y reduciéndolo a la nulidad para representar la quiebra de su inversión.

      const monto_resultado = gano ? parseFloat((monto * 2).toFixed(2)) : 0;


    // Delta de saldo:
    //   gana  → recibe monto * 2, pero ya se descontó el monto → ganancia neta = monto
    //   pierde → pierde el monto apostado

        // Determinamos la variación absoluta cruzando el estado de victoria o derrota
        // y perfilamos la cifra final de fondos que el usuario ostentará post-apuesta.

        const delta_saldo = gano ? monto : -monto;
        const saldo_nuevo = parseFloat((Number(saldo) + delta_saldo).toFixed(2));


    // Mensaje educativo aleatorio

        // Seleccionamos un consejo de concientización aleatorio de nuestra matriz estática
        // para mitigar psicológicamente el impacto del juego según los objetivos de MoneduK.

        const leccion_moral = LECCIONES_MORALES[Math.floor(Math.random() * LECCIONES_MORALES.length)];


    // Daño fijo: -10 HP siempre, 0 XP

        // Seteamos una penalidad física innegociable sobre el estado de la mascota
        // como mecánica punitiva para desalentar el uso continuo del minijuego de azar.

        const impacto_salud = -10;

       await conn.beginTransaction();


    // 1. Registrar apuesta

        // Volcamos todas las métricas de la tirada en el historial inmutable del usuario
        // anidando el consejo entregado y la merma sufrida por el compañero virtual.

        const [apuestaResult] = await conn.query(
          `INSERT INTO apuesta
             (id_usuario, monto_apostado, resultado, monto_resultado, leccion_moral, impacto_salud)
          VALUES (?,?,?,?,?,?)`,
         [id_usuario, monto, resultado, monto_resultado, leccion_moral, impacto_salud]
       );


    // 2. Actualizar wallet

        // Impactamos la cuenta corriente aplicando el delta (negativo o positivo)
        // e inflamos el historial de dinero despilfarrado en apuestas para la analítica.

        await conn.query(
          `UPDATE wallet
          SET saldo = saldo + ?,
               total_gastado = total_gastado + ?
              WHERE id_wallet = ?`,
          [delta_saldo, monto, id_wallet]
    );

    // 3. Transacción

        // Ingresamos el movimiento explícito bajo la clasificación de juegos (id_tipo = 5)
        // para que la interfaz de la billetera renderice el concepto exacto y su desenlace.

        await conn.query(
        'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,5,?,?)',
          [id_wallet, monto, `Apuesta — ${resultado} (${gano ? '+' + monto : '-' + monto} KoinK)`]
    );


    // 4. -10 HP siempre, 0 XP
    
        // Convocamos al servicio unificador de salud para inyectar la reducción obligatoria
        // saltándonos el umbral para asegurar que el daño perfore escudos o prevenciones.

        const mascotaResult = await aplicarXPySalud(
         conn, id_usuario,
          0, // sin XP
         impacto_salud, // -10 HP
          100, // siempre se aplica daño sin importar el resultado
           'Realizó una apuesta'
        );

        await conn.commit();

        return R.ok(res, {
            resultado,
            monto_apostado: monto,
            monto_resultado,
            delta_saldo,
            saldo_nuevo,
            mascota: mascotaResult,
            salud_perdida: 10,
            xp_ganado: 0,
            leccion_moral,
            advertencia: '⚠️ Apostar siempre quita 10 HP a tu cerdito, aunque ganes.',
        }, gano
          ? `¡Ganaste 🪙 ${monto} KoinK extra! Pero tu cerdito perdió 10 HP 😟`
          : `Perdiste 🪙 ${monto} KoinK y tu cerdito perdió 10 HP 😢`
      );
        } catch (err) {
          await conn.rollback();
          return R.serverError(res, err);
        } finally {
      conn.release();
        }
    };

// Historial

    const getHistorialApuestas = async (req, res) => {
    try {

      // Limitamos la extracción a los últimos 50 movimientos riesgosos del jugador
      // para nutrir el feed visual de su módulo sin saturar el ancho de banda del canal.
      
      const [rows] = await pool.query(
        `SELECT monto_apostado, resultado, monto_resultado,
              leccion_moral, impacto_salud, fecha
        FROM apuesta
        WHERE id_usuario = ?
        ORDER BY fecha DESC LIMIT 50`,
          [req.user.id_usuario]
        );
      return R.ok(res, rows);
    } catch (err) { return R.serverError(res, err); }
  };

  module.exports = { realizarApuesta, getHistorialApuestas };