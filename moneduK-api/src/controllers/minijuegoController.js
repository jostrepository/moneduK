const { pool } = require('../config/db');
const R = require('../utils/response');
const { aplicarXPySalud } = require('../utils/mascotaHelper');


// Banco de 20 preguntas (índice 0-19)

    const PREGUNTAS = [
      { // 0
        pregunta: '¿Qué es el ahorro?',
        opciones: ['Gastar todo lo que tienes', 'Guardar parte del dinero para el futuro', 'Pedir dinero prestado', 'Apostar tu dinero'],
        correcta: 1,
      },

      { // 1
        pregunta: '¿Cuál es un buen hábito financiero?',
        opciones: ['Gastar más de lo que ganas', 'Comprar todo lo que ves', 'Registrar tus ingresos y gastos', 'Ignorar tus deudas'],
        correcta: 2,
      },

      { // 2
        pregunta: '¿Qué es un presupuesto?',
        opciones: ['Un tipo de deuda', 'Un plan para organizar tus ingresos y gastos', 'Una forma de apostar', 'Un préstamo bancario'],
        correcta: 1,
      },

      { // 3
        pregunta: '¿Por qué es importante ahorrar desde joven?',
        opciones: ['No es importante', 'Para tener más dinero en el futuro gracias al interés compuesto', 'Solo los adultos deben ahorrar', 'Para gastar más después'],
        correcta: 1,
      },

      { // 4
        pregunta: '¿Qué es una inversión?',
        opciones: ['Perder dinero a propósito', 'Gastar en cosas innecesarias', 'Poner dinero en algo que puede generar ganancias', 'Regalar tu dinero'],
        correcta: 2,
      },

      { // 5
        pregunta: '¿Qué deberías hacer antes de comprar algo costoso?',
        opciones: ['Comprarlo de inmediato', 'Pedirlo prestado y no pagar', 'Pensar si realmente lo necesitas y si tienes el dinero', 'Apostar para ganar más dinero primero'],
        correcta: 2,
      },

      { // 6
        pregunta: '¿Qué significa "vivir dentro de tus posibilidades"?',
        opciones: ['Gastar más de lo que ganas', 'Gastar solo lo que puedes pagar', 'Nunca gastar nada', 'Pedir préstamos constantemente'],
        correcta: 1,
      },

      { // 7
        pregunta: '¿Cuál es el riesgo principal de las apuestas?',
        opciones: ['Ganar demasiado dinero', 'Perder el dinero que apostaste', 'Ahorrar más', 'Invertir mejor'],
        correcta: 1,
      },

      { // 8
        pregunta: '¿Qué es el interés en un banco?',
        opciones: ['Una multa por ahorrar', 'Dinero extra que ganas por mantener tus ahorros', 'Un impuesto obligatorio', 'El precio de un producto'],
        correcta: 1,
      },
      
      { // 9
        pregunta: '¿Qué es una necesidad básica?',
        opciones: ['Un videojuego nuevo', 'Ropa de marca', 'Comida, vivienda y salud', 'Un viaje de lujo'],
        correcta: 2,
      },

      { // 10
        pregunta: '¿Qué diferencia hay entre necesidad y deseo?',
        opciones: ['Son lo mismo', 'La necesidad es esencial para vivir; el deseo es opcional', 'El deseo es más importante', 'No hay diferencia financiera'],
        correcta: 1,
      },

      { // 11
        pregunta: '¿Cómo puedes ganar dinero de forma honesta?',
        opciones: ['Apostando', 'Trabajando, ofreciendo servicios o vendiendo productos', 'Pidiendo prestado y no pagando', 'Esperando que alguien te lo dé'],
        correcta: 1,
      },

      { // 12
        pregunta: '¿Qué es una deuda?',
        opciones: ['Dinero que te deben a ti', 'Dinero que tú debes a alguien más', 'Una forma de ahorro', 'Un tipo de inversión'],
        correcta: 1,
      },

      { // 13
        pregunta: '¿Qué porcentaje de tus ingresos recomiendan los expertos ahorrar?',
        opciones: ['0%', '5%', 'Al menos 20%', '80%'],
        correcta: 2,
      },

      { // 14
        pregunta: '¿Qué es el fondo de emergencia?',
        opciones: ['Dinero para gastar en lujos', 'Dinero guardado para imprevistos o emergencias', 'Un tipo de apuesta segura', 'Un préstamo bancario'],
        correcta: 1,
      },

      { // 15
        pregunta: '¿Por qué es malo gastar todo el dinero apenas lo recibes?',
        opciones: ['No es malo, es lo mejor', 'Porque no tendrás dinero para emergencias ni el futuro', 'Porque el dinero pierde valor', 'Porque el banco se enoja'],
        correcta: 1,
      },

      { // 16
        pregunta: '¿Qué es la inflación?',
        opciones: ['Cuando los precios bajan con el tiempo', 'Cuando el dinero pierde valor porque los precios suben', 'Un tipo de ahorro', 'El precio de las acciones'],
        correcta: 1,
      },

      { // 17
        pregunta: '¿Cuál es la ventaja de comparar precios antes de comprar?',
        opciones: ['Ninguna', 'Gastar más tiempo innecesariamente', 'Ahorrar dinero eligiendo la mejor opción', 'Comprar más productos'],
        correcta: 2,
      },

      { // 18
        pregunta: '¿Qué significa tener metas financieras?',
        opciones: ['Gastar sin control', 'Definir objetivos de ahorro o inversión para el futuro', 'Solo pensar en el presente', 'Apostar para alcanzar metas rápido'],
        correcta: 1,
      },

      { // 19
        pregunta: '¿Qué deberías hacer si tienes deudas?',
        opciones: ['Ignorarlas y gastar más', 'Pagarlas lo antes posible empezando por las de mayor interés', 'Pedir más préstamos', 'Apostar para pagarlas rápido'],
        correcta: 1,
      },
  ];

// Estado del quiz

    const getEstadoQuiz = async (req, res) => {
      try {

        // Consultamos el registro más reciente del usuario en este minijuego específico
        // para determinar la viabilidad de una nueva sesión basándonos en la fecha.

        const [rows] = await pool.query(
          `SELECT fecha FROM historial_minijuego
          WHERE id_usuario = ? AND tipo = 'quiz'
          ORDER BY fecha DESC LIMIT 1`,
          [req.user.id_usuario]
        );
        if (rows.length === 0) return R.ok(res, { puede_jugar: true, minutos_restantes: 0 });


        // Evaluamos el tiempo transcurrido desde la última partida para validar el cooldown
        // devolviendo los minutos exactos restantes si el periodo de bloqueo sigue activo.

        const minutos = (new Date() - new Date(rows[0].fecha)) / 60000;
        if (minutos >= 120) return R.ok(res, { puede_jugar: true, minutos_restantes: 0 });

        return R.ok(res, {
          puede_jugar: false,
          minutos_restantes: Math.ceil(120 - minutos),
          proxima_partida: new Date(new Date(rows[0].fecha).getTime() + 120 * 60000),
        });
      } catch (err) { return R.serverError(res, err); }
  };


// Obtener preguntas

/**
 * GET /minijuegos/quiz/preguntas
 * Devuelve 5 preguntas aleatorias CON sus indices_originales
 * para que el frontend pueda enviarlos al completar.
 * NO incluye la respuesta correcta.
 */

    const getPreguntas = async (req, res) => {
      try {

        // Ejecutamos una segunda capa de seguridad consultando nuevamente el cooldown
        // para bloquear a los usuarios que intenten saltarse la restricción desde el frontend.

        const [rows] = await pool.query(
          `SELECT fecha FROM historial_minijuego
          WHERE id_usuario = ? AND tipo = 'quiz'
          ORDER BY fecha DESC LIMIT 1`,
          [req.user.id_usuario]
        );
        if (rows.length > 0) {
          const min = (new Date() - new Date(rows[0].fecha)) / 60000;
          if (min < 120) {
            return R.badRequest(res, `Puedes jugar en ${Math.ceil(120 - min)} minutos.`);
          }
        }


    // Seleccionar 5 índices aleatorios únicos del banco

        // Barajamos matemáticamente el índice completo del banco de preguntas estático
        // para extraer una muestra impredecible y garantizar la rejugabilidad del quiz.

        const todosIndices = Array.from({ length: PREGUNTAS.length }, (_, i) => i);
        const shuffled = todosIndices.sort(() => Math.random() - 0.5);
        const indices = shuffled.slice(0, 5);


        // Mapeamos los datos purgados de las preguntas seleccionadas para el cliente
        // omitiendo intencionalmente la respuesta correcta para evitar trampas por red.

        const preguntas = indices.map((idx, i) => ({
          id: i,
          pregunta: PREGUNTAS[idx].pregunta,
          opciones: PREGUNTAS[idx].opciones,

      // ⚠️ No incluye que se muestre opción correcta por el momento
    }));

        return R.ok(res, {
          preguntas,
          indices_originales: indices, // el frontend los guarda y envía al completar
          total:              5,
          cooldown_min:       120,
        });
      } catch (err) { return R.serverError(res, err); }
  };


// Completar quiz

/**
 * POST /minijuegos/quiz/completar
 * Body: {
 *   respuestas: [2, 0, 1, 2, 1],        ← índice de opción elegida (0-3)
 *   indices_preguntas: [4, 11, 7, 0, 16] ← índices del banco original
 * }
 */

    const completarQuiz = async (req, res) => {
      const conn = await pool.getConnection();
      try {
        const { respuestas, indices_preguntas } = req.body;
        const id_usuario = req.user.id_usuario;


        // Validamos estructuralmente el arreglo de respuestas e índices recibidos
        // rechazando envíos incompletos o manipulados que rompan la lógica de calificación.

        if (!Array.isArray(respuestas) || respuestas.length !== 5) {
          return R.badRequest(res, 'Debes enviar exactamente 5 respuestas');
        }
        if (!Array.isArray(indices_preguntas) || indices_preguntas.length !== 5) {
          return R.badRequest(res, 'Debes enviar los 5 índices de preguntas');
        }


    // Verificar cooldown
        // Comprobamos por tercera y última vez la legitimidad de la ventana de tiempo
        // evitando que scripts automáticos exploten el endpoint de recompensas.

        const [histRows] = await conn.query(
          `SELECT fecha FROM historial_minijuego
          WHERE id_usuario = ? AND tipo = 'quiz'
          ORDER BY fecha DESC LIMIT 1`,
          [id_usuario]
        );
        if (histRows.length > 0) {
          const min = (new Date() - new Date(histRows[0].fecha)) / 60000;
          if (min < 120) {
            conn.release();
            return R.badRequest(res, `Cooldown activo. Espera ${Math.ceil(120 - min)} minutos.`);
          }
        }


    // Calcular resultados usando los índices originales
        // Contrastamos las selecciones del usuario directamente contra la matriz del servidor
        // asegurando una auditoría inviolable del puntaje y generando el desglose de aciertos.

        const resultados = indices_preguntas.map((idxOriginal, i) => {
          const pregObj = PREGUNTAS[idxOriginal];
          const respUsuario = respuestas[i];
          const correcta = pregObj.correcta === respUsuario;
          return {
            pregunta: pregObj.pregunta,
            opcion_elegida: pregObj.opciones[respUsuario]  ?? 'Sin respuesta',
            opcion_correcta: pregObj.opciones[pregObj.correcta],
            indice_correcto: pregObj.correcta,
            correcta,
          };
        });

        // Tabulamos las métricas finales de desempeño aislando aciertos de errores
        // para estructurar las variables que alimentarán los algoritmos de recompensa.
        const aciertos = resultados.filter(r => r.correcta).length;
        const errores  = 5 - aciertos;

        
        // Definimos las compensaciones de la actividad aplicando multiplicadores de desempeño
        // donde cada acierto suma puntos positivos y cada error penaliza la integridad final.

        const koin_ganado = 50;
        const xp_ganado   = 50;
        const salud_delta = (aciertos * 10) - (errores * 10);


        // Preparamos el entorno financiero consultando el balance del jugador en curso
        // y estableciendo un punto de control para la transacción atómica inminente.

        const [walletRows] = await conn.query(
          'SELECT id_wallet, saldo FROM wallet WHERE id_usuario = ?', [id_usuario]
        );
        if (walletRows.length === 0) { conn.release(); return R.notFound(res, 'Wallet no encontrada'); }
        const { id_wallet, saldo } = walletRows[0];

        await conn.beginTransaction();


        // Ingresamos el comprobante del minijuego con su calificación y ganancias
        // sellando el timestamp que iniciará la cuenta regresiva del cooldown en la base de datos.

        await conn.query(
          `INSERT INTO historial_minijuego (id_usuario, tipo, puntaje, koin_ganado, xp_ganado)
          VALUES (?, 'quiz', ?, ?, ?)`,
          [id_usuario, aciertos, koin_ganado, xp_ganado]
        );


        // Inyectamos la recompensa estática a la billetera y actualizamos el libro mayor
        // engrosando el indicador de riqueza acumulada para el motor de machine learning.

        await conn.query(
          'UPDATE wallet SET saldo = saldo + ?, total_ganado = total_ganado + ? WHERE id_wallet = ?',
          [koin_ganado, koin_ganado, id_wallet]
        );


        // Asentamos el justificante financiero de la entrada con la etiqueta de premio
        // permitiéndole al usuario auditar el origen de este ingreso en su módulo.

        await conn.query(
          'INSERT INTO transaccion (id_wallet, id_tipo, monto, descripcion) VALUES (?,6,?,?)',
          [id_wallet, koin_ganado, `Quiz financiero — ${aciertos}/5 aciertos`]
        );


        // Transferimos el resultado matemático del quiz al sistema de la mascota
        // procesando el crecimiento o decrecimiento de la salud a través del helper centralizado.

        const mascotaResult = await aplicarXPySalud(
          conn, id_usuario, xp_ganado, salud_delta, 100,
          `Quiz financiero — ${aciertos}/5 aciertos`
        );

        await conn.commit();

        return R.ok(res, {
            aciertos,
            errores,
            puntaje: `${aciertos}/5`,
            resultados,
            koin_ganado,
            xp_ganado,
            salud_delta,
            saldo_nuevo: Number(saldo) + koin_ganado,
            mascota: mascotaResult,
            proximo_juego: new Date(Date.now() + 120 * 60000),
        }, `¡Quiz completado! ${aciertos}/5 respuestas correctas 🎉`);
      } catch (err) {
        await conn.rollback();
        return R.serverError(res, err);
      } finally {
        conn.release();
      }
  };

  module.exports = { getEstadoQuiz, getPreguntas, completarQuiz };