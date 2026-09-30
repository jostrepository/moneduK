const { pool } = require('../config/db');
const R = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');


// Tipos de inversión

    const getTiposInversion = async (req, res) => {
      try {

        // Consultamos el catálogo maestro de instrumentos financieros disponibles
        // ordenándolos por su rentabilidad de menor a mayor riesgo para el frontend.

        const [rows] = await pool.query('SELECT * FROM tipo_inversion ORDER BY rendimiento_pct ASC');
        return R.ok(res, rows);
      } catch (err) { return R.serverError(res, err); }
  };


// Mis inversiones

    const getMisInversiones = async (req, res) => {
      try {

        // Cruzamos la tabla de inversiones activas con su tipo para enviar datos enriquecidos
        // y calculamos los minutos restantes en tiempo real usando funciones de MySQL.

        const [rows] = await pool.query(
          `SELECT i.id_inversion, i.monto_invertido, i.rendimiento_esperado,
                i.fecha_inicio, i.fecha_vencimiento, i.estado,
                ti.nombre AS tipo, ti.rendimiento_pct,
                TIMESTAMPDIFF(MINUTE, NOW(), i.fecha_vencimiento) AS minutos_restantes
          FROM inversion i
          JOIN tipo_inversion ti ON ti.id_tipo_inv = i.id_tipo_inv
          WHERE i.id_usuario = ?
          ORDER BY i.fecha_inicio DESC`,
          [req.user.id_usuario]
        );
        return R.ok(res, rows);
      } catch (err) { return R.serverError(res, err); }
  };


// Verificar cooldown (8 horas desde la última inversión completada o activa) 

    const verificarCooldown = async (id_usuario) => {

      // Extraemos la última inversión registrada por el usuario para validar tiempos
      // y prevenir el abuso del sistema de economía interna con farming masivo.

      const [rows] = await pool.query(
        `SELECT fecha_inicio FROM inversion
        WHERE id_usuario = ? AND estado = 'activa'
        ORDER BY fecha_inicio DESC LIMIT 1`,
        [id_usuario]
      );
      if (rows.length === 0) return { enCooldown: false };

      const fechaUltima = new Date(rows[0].fecha_inicio);
      const ahora = new Date();
      const horasTranscurridas = (ahora - fechaUltima) / (1000 * 60 * 60);


      // Calculamos la brecha temporal e imponemos un freno matemático de 8 horas
      // devolviendo el tiempo exacto que le falta al jugador para volver a invertir.

      if (horasTranscurridas < 8) {
        const horasRestantes = Math.ceil(8 - horasTranscurridas);
        return { enCooldown: true, horasRestantes };
      }
      return { enCooldown: false };
  };


// Crear inversión
/**
 * POST /inversiones
 * - Cooldown de 8 horas entre inversiones
 * - Rendimiento aleatorio entre 1% y 15% del monto
 * - Al cobrar: +100 XP y +20 salud (umbral 80)
 */

    const crearInversion = async (req, res) => {
      const conn = await pool.getConnection();
      try {
        const { id_tipo_inv, monto } = req.body;
        const id_usuario = req.user.id_usuario;


        // Verificar cooldown

        // Disparamos la validación de cooldown antes de abrir transacciones costosas
        // para abortar rápido y de forma segura si el usuario está bajo penalización.

        const cooldown = await verificarCooldown(id_usuario);
        if (cooldown.enCooldown) {
          return R.badRequest(
            res,
            `Debes esperar ${cooldown.horasRestantes} hora(s) antes de crear otra inversión.`
          );
        }


    // Obtener tipo

        // Comprobamos la existencia del instrumento financiero en el catálogo
        // para evitar vulnerabilidades de ID inyectado desde la petición del cliente.

        const [tipos] = await conn.query('SELECT * FROM tipo_inversion WHERE id_tipo_inv = ?', [id_tipo_inv]);
        if (tipos.length === 0) return R.notFound(res, 'Tipo de inversión no encontrado');


    // Verificar saldo

        // Auditamos el balance financiero actual del usuario en la base de datos
        // garantizando que dispone del capital suficiente para bloquear en la inversión.

        const [walletRows] = await conn.query(
          'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
        );
        if (walletRows.length === 0) return R.notFound(res, 'Wallet no encontrada');
        const { id_wallet, saldo } = walletRows[0];
        if (Number(saldo) < monto) return R.badRequest(res, 'Saldo insuficiente');


    // Rendimiento aleatorio entre 1% y 15%

        // Simulamos la volatilidad del mercado generando un retorno porcentual dinámico
        // y proyectamos las ganancias absolutas que recibirá al finalizar el plazo.

        const rendimiento_pct = parseFloat((Math.random() * (15 - 1) + 1).toFixed(2));
        const rendimiento_esperado = parseFloat((monto * rendimiento_pct / 100).toFixed(2));


    // Vencimiento: 8 horas desde ahora

        // Establecemos el sello temporal exacto de liberación de los fondos
        // sumando las 8 horas reglamentarias al timestamp actual del sistema.

        const fecha_vencimiento = new Date(Date.now() + 8 * 60 * 60 * 1000);

        await conn.beginTransaction();


    // 1. Crear inversión

        // Asentamos formalmente el compromiso financiero en la tabla de inversiones
        // congelando las condiciones pactadas (monto y fecha) para su futuro cobro.

        const [invResult] = await conn.query(
          `INSERT INTO inversion
            (id_usuario, id_tipo_inv, monto_invertido, rendimiento_esperado, fecha_vencimiento)
          VALUES (?,?,?,?,?)`,
          [id_usuario, id_tipo_inv, monto, rendimiento_esperado, fecha_vencimiento]
        );


    // 2. Descontar saldo

        // Retiramos inmediatamente el capital de riesgo de su cuenta de ahorros
        // y lo marcamos dentro de las métricas globales como un gasto efectuado.

        await conn.query(
          'UPDATE wallet SET saldo = saldo - ?, total_gastado = total_gastado + ? WHERE id_wallet = ?',
          [monto, monto, id_wallet]
        );


    // 3. Registrar transacción

        // Dejamos un registro inmutable en el libro mayor como inversión (id_tipo = 4)
        // para asegurar la trazabilidad del dinero y alimentar el historial de la app.

        await conn.query(
          'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,4,?,?)',
          [id_wallet, monto, `Inversión en ${tipos[0].nombre} (${rendimiento_pct}% rendimiento)`]
        );

        await conn.commit();

        return R.created(res, {
          id_inversion: invResult.insertId,
          monto_invertido: monto,
          rendimiento_pct,
          rendimiento_esperado,
          fecha_vencimiento,
          saldo_nuevo: Number(saldo) - monto,
          cooldown_horas: 8,
        }, `¡Inversión creada! Ganarás 🪙 ${rendimiento_esperado} KoinK (${rendimiento_pct}%) en 8 horas 📈`);
      } catch (err) {
        await conn.rollback();
        return R.serverError(res, err);
      } finally {
        conn.release();
      }
  };


// Cobrar inversión

/**
 * POST /inversiones/:id/cobrar
 * Al cobrar: +100 XP y +20 salud (umbral 80 — si salud >= 80 se suma solo hasta 100)
 */

    const cobrarInversion = async (req, res) => {
        const conn = await pool.getConnection();
        try {
          const { id } = req.params;
          const id_usuario = req.user.id_usuario;


          // Localizamos el contrato de inversión usando el ID y la firma del usuario
          // validando que siga en estado activo para evitar escenarios de doble cobro.

          const [inversiones] = await conn.query(
            "SELECT * FROM inversion WHERE id_inversion = ? AND id_usuario = ? AND estado = 'activa'",
            [id, id_usuario]
          );
          if (inversiones.length === 0) return R.notFound(res, 'Inversión no encontrada o ya cobrada');


          // Bloqueamos retiros tempranos comparando el reloj actual contra el vencimiento
          // y devolvemos la diferencia exacta en minutos como feedback al usuario.

          const inv = inversiones[0];
          if (new Date() < new Date(inv.fecha_vencimiento)) {
            const min = Math.ceil((new Date(inv.fecha_vencimiento) - new Date()) / 60000);
            return R.badRequest(res, `La inversión aún no ha vencido. Faltan ${min} minutos.`);
          }


          // Computamos el desembolso final sumando el capital inicial y las ganancias
          // para garantizar que la aritmética de la base de datos coincida con la liquidación.
          
          const total_cobro = parseFloat(
            (Number(inv.monto_invertido) + Number(inv.rendimiento_esperado)).toFixed(2)
          );


          // Ubicamos la cartera del inversionista para inyectarle los beneficios
          // extrayendo previamente el saldo base para devolverlo actualizado.

          const [walletRows] = await conn.query(
            'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
          );
          const { id_wallet, saldo } = walletRows[0];

          await conn.beginTransaction();


    // Marcar completada

        // Clausuramos el contrato financiero cambiando su bandera de estado a "completada"
        // inhabilitando permanentemente futuros intentos de cobro sobre este ID.

        await conn.query(
          "UPDATE inversion SET estado = 'completada' WHERE id_inversion = ?", [id]
        );


    // Acreditar total

        // Inyectamos el capital liberado de vuelta en el flujo de caja del usuario
        // reflejando simultáneamente el incremento en sus métricas de rendimiento total.

        await conn.query(
          'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
          [total_cobro, total_cobro, id_wallet]
        );


    // Transacción

        // Firmamos el ingreso en el historial financiero como retorno de inversión
        // documentando la trazabilidad de los fondos y su respectivo número de contrato.
        await conn.query(
          'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,4,?,?)',
          [id_wallet, total_cobro, `Cobro inversión #${id} + rendimiento`]
        );


    // +100 XP y +20 salud (umbral 80)

        // Delegamos la evolución de la mascota al helper de progresión central
        // premiando la paciencia del jugador con experiencia y recuperación de salud.

        const mascotaResult = await aplicarXPySalud(
          conn, id_usuario,
          100,// XP
          20,// salud sumada
          80,// umbral: si salud >= 80, se ajusta hasta 100
          `Cobró inversión #${id}`
        );

        await conn.commit();

        return R.ok(res, {
          monto_invertido: Number(inv.monto_invertido),
          rendimiento: Number(inv.rendimiento_esperado),
          total_cobrado: total_cobro,
          saldo_nuevo: Number(saldo) + total_cobro,
          mascota: mascotaResult,
          xp_ganado: 100,
          salud_ganada: 20,
        }, '¡Inversión cobrada con éxito! 🎉');
      } catch (err) {
        await conn.rollback();
        return R.serverError(res, err);
      } finally {
        conn.release();
      }
  };

  module.exports = { getTiposInversion, getMisInversiones, crearInversion, cobrarInversion };