// Consulta el servicio Flask y retorna el perfil y consejo del cerdito al frontend.

const { pool } = require('../config/db');
const R = require('../utils/response');
const axios = require('axios');

const ML_URL = process.env.ML_URL || 'http://127.0.0.1:5001';

// Obtener perfil y consejo del cerdito 

/**
 * GET /ml/perfil
 * Recopila el historial financiero del usuario desde MySQL,
 * consulta el modelo de ML en Flask y retorna el perfil
 * con el consejo personalizado para mostrar en la app.
 */

    const getPerfilCerdito = async (req, res) => {
      try {
        const id_usuario = req.user.id_usuario;

    // 1. Recopilar datos del usuario desde MySQL 

        const [walletRows] = await pool.query(
          `SELECT saldo, total_ganado, total_gastado
          FROM wallet WHERE id_usuario = ?`,
          [id_usuario]
        );

        const [mascotaRows] = await pool.query(
          `SELECT salud FROM mascota WHERE id_usuario = ?`,
          [id_usuario]
        );

        const [trabajosRows] = await pool.query(
          `SELECT COUNT(*) AS total FROM historial_trabajo
          WHERE id_usuario = ?`,
          [id_usuario]
        );

        const [inversionesRows] = await pool.query(
          `SELECT COUNT(*) AS total FROM inversion
          WHERE id_usuario = ?`,
          [id_usuario]
        );

        const [apuestasRows] = await pool.query(
          `SELECT COUNT(*) AS total FROM apuesta
          WHERE id_usuario = ?`,
          [id_usuario]
        );

        const [misionesRows] = await pool.query(
          `SELECT COUNT(*) AS total FROM mision_usuario
          WHERE id_usuario = ? AND completada = 1`,
          [id_usuario]
        );

        const [quizRows] = await pool.query(
          `SELECT AVG(puntaje) AS promedio FROM historial_minijuego
          WHERE id_usuario = ? AND tipo = 'quiz'`,
          [id_usuario]
        );

    // 2. Calcular features

        const wallet = walletRows[0] || { saldo: 0, total_ganado: 0, total_gastado: 0 };
        const salud = mascotaRows[0]?.salud ?? 50;
        const num_trabajos = trabajosRows[0]?.total   ?? 0;
        const num_inversiones = inversionesRows[0]?.total ?? 0;
        const num_apuestas = apuestasRows[0]?.total   ?? 0;
        const num_misiones = misionesRows[0]?.total   ?? 0;
        const puntaje_quiz = parseFloat(quizRows[0]?.promedio ?? 0).toFixed(1);

        const total_ganado = Number(wallet.total_ganado)  || 1;
        const total_gastado = Number(wallet.total_gastado) || 0;
        const ratio_gasto = parseFloat(
          Math.min(total_gastado / total_ganado, 1).toFixed(2)
        );

    // Ahorro estimado = ingresos por trabajos/lecciones/misiones

        const total_ahorrado = Math.max(0, Number(wallet.saldo));

        const features = {
            total_ahorrado,
            num_apuestas: Number(num_apuestas),
            num_trabajos: Number(num_trabajos),
            num_inversiones: Number(num_inversiones),
            num_misiones: Number(num_misiones),
            salud_mascota: Number(salud),
            saldo_actual: Number(wallet.saldo),
            puntaje_quiz_promedio: Number(puntaje_quiz),
            ratio_gasto,
        };

    // 3. Consultar modelo ML en Flask

        let mlResponse;
        try {
          mlResponse = await axios.post(`${ML_URL}/predecir`, features, {
            timeout: 5000,
          });
        } catch (mlErr) {

      // Si Flask no está disponible, retornar perfil neutro

          return R.ok(res, {
              perfil: 'Aprendiz',
              confianza: 0,
              estado: 'animado',
              emoji: '📚',
              titulo: '¡Estás aprendiendo!',
              consejo: 'Sigue explorando MoneduK para descubrir tu perfil financiero.',
              ml_activo: false,
          });
        }

        const ml = mlResponse.data;

    // 4. Retornar resultado al frontend

        return R.ok(res, {
            perfil: ml.perfil,
            confianza: ml.confianza,
            estado: ml.estado,
            emoji: ml.emoji,
            titulo: ml.titulo,
            consejo: ml.consejo,
            ml_activo: true,
            features, // útil para debugging y para el informe
        });

      } catch (err) {
        return R.serverError(res, err);
      }
  };

  module.exports = { getPerfilCerdito };
