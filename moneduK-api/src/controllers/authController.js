const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const R = require('../utils/response');

// Helpers

/**
 * Genera un token JWT firmado para un usuario autenticado.
 *
 * IMPORTANTE: las propiedades de "usuario" deben coincidir EXACTAMENTE
 * con las que se le pasan al llamar esta función desde register/login
 * (id_usuario, email, id_rol). Si los nombres no coinciden, las
 * propiedades del payload quedan undefined y jsonwebtoken las descarta
 * silenciosamente al firmar, generando un token "vacío" (solo con iat/exp)
 * que rompe cualquier ruta protegida por authMiddleware, ya que
 * req.user.id_usuario terminaría siendo undefined.
 *
 * @param {Object} usuario - datos mínimos del usuario para el payload
 * @param {number} usuario.id_usuario - ID numérico del usuario en la BD
 * @param {string} usuario.email - correo del usuario
 * @param {number} usuario.id_rol - rol del usuario (1=estudiante, 2=tutor)
 * @returns {string} token JWT firmado, válido por JWT_EXPIRES_IN
 */
function generarToken(usuario) {
  const payload = {
    id_usuario: usuario.id_usuario, // antes: usuario.id (no existía → undefined)
    email: usuario.email,           // antes: usuario.correo (no existía → undefined)
    id_rol: usuario.id_rol,         // antes: usuario.rol (no existía → undefined)
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Registro 

/**
 * POST /auth/register
 * Crea un nuevo usuario (estudiante o tutor), su wallet y su mascota (si es estudiante).
 */

    const register = async (req, res) => {
      const conn = await pool.getConnection();
      try {
        const {
          nombre,
          apellido,
          email,
          contrasena,
          fecha_nacimiento = null,
          id_rol = 1, // 1 = estudiante por defecto
      } = req.body;

    // Verificar email único

        const [existe] = await conn.query(
          'SELECT id_usuario FROM usuario WHERE email = ?',
          [email]
        );
        if (existe.length > 0) {
          return R.conflict(res, 'El correo electrónico ya está registrado');
        }

        const hash = await bcrypt.hash(contrasena, Number(process.env.BCRYPT_ROUNDS) || 10);

        await conn.beginTransaction();

    // 1. Insertar usuario

        const [userResult] = await conn.query(
          `INSERT INTO usuario (id_rol, nombre, apellido, email, contrasena_hash, fecha_nacimiento)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id_rol, nombre, apellido, email, hash, fecha_nacimiento]
        );
        const id_usuario = userResult.insertId;

    // 2. Crear wallet

        await conn.query(
          'INSERT INTO wallet (id_usuario) VALUES (?)',
          [id_usuario]
        );

    // 3. Si es estudiante, crear mascota con estado "Excelente" (id_estado = 1)

        if (Number(id_rol) === 1) {
          await conn.query(
            `INSERT INTO mascota (id_usuario, id_estado) VALUES (?, 1)`,
            [id_usuario]
          );
        }

        await conn.commit();

        const token = generarToken({ id_usuario, email, id_rol: Number(id_rol) });

        return R.created(res, { token, id_usuario }, 'Usuario registrado é xitosamente');
      } catch (err) {
        await conn.rollback();
        return R.serverError(res, err);
      } finally {
        conn.release();
      }
    };

// Login 

/**
 * POST /auth/login
 */

    const login = async (req, res) => {
      try {
        const { email, contrasena } = req.body;

        const [rows] = await pool.query(
          `SELECT u.id_usuario, u.id_rol, u.nombre, u.apellido, u.email,
              u.contrasena_hash, u.activo
          FROM usuario u
          WHERE u.email = ?`,
          [email]
        );

        if (rows.length === 0) {
          return R.unauthorized(res, 'Credenciales incorrectas');
        }

        const user = rows[0];

        if (!user.activo) {
          return R.unauthorized(res, 'Cuenta desactivada. Contacta con soporte.');
        }

        const passwordOk = await bcrypt.compare(contrasena, user.contrasena_hash);
        if (!passwordOk) {
          return R.unauthorized(res, 'Credenciales incorrectas');
        }

        const token = generarToken({
          id_usuario: user.id_usuario,
          email: user.email,
          id_rol: user.id_rol,
        });

        return R.ok(res, {
          token,
          usuario: {
            id_usuario: user.id_usuario,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            id_rol: user.id_rol,
          },
        }, 'Inicio de sesión exitoso');
      } catch (err) {
        return R.serverError(res, err);
      }
  };

// Perfil propio

/**
 * GET /auth/me  (requiere JWT)
 */

    const me = async (req, res) => {
      try {
        const [rows] = await pool.query(
          `SELECT u.id_usuario, u.nombre, u.apellido, u.email,
              u.fecha_nacimiento, u.avatar_url, u.fecha_registro,
              r.nombre AS rol,
              w.saldo, w.total_ganado, w.total_gastado
          FROM usuario u
          JOIN rol r ON r.id_rol = u.id_rol
          LEFT JOIN wallet w ON w.id_usuario = u.id_usuario
          WHERE u.id_usuario = ?`,
          [req.user.id_usuario]
        );

        if (rows.length === 0) return R.notFound(res, 'Usuario no encontrado');

        return R.ok(res, rows[0]);
      } catch (err) {
        return R.serverError(res, err);
      }
  };  

  module.exports = { register, login, me };
