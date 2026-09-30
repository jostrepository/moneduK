const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const R = require('../utils/response');

// Helpers

/**
 * Genera un token JWT firmado para un usuario autenticado.
 * @param {Object} usuario - datos mínimos del usuario para el payload
 * @param {number} usuario.id_usuario - ID numérico del usuario en la BD
 * @param {string} usuario.email - correo del usuario
 * @param {number} usuario.id_rol - rol del usuario (1=estudiante, 2=tutor)
 * @returns {string} token JWT firmado, válido por JWT_EXPIRES_IN
 */
function generarToken(usuario) {
  
  // Empaquetamos los identificadores críticos del usuario en un payload cifrado
  // definiendo sus fronteras de autorización sin saturar el tamaño de la cabecera.

  const payload = {
    id_usuario: usuario.id_usuario, 
    email: usuario.email,           
    id_rol: usuario.id_rol,        
  };


  // Firmamos el paquete utilizando el algoritmo encriptado respaldado por la variable de entorno
  // sellando su ciclo de vida útil (7 días) para invalidar accesos en sesiones muertas.

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

        // Escaneamos las direcciones activas para bloquear intentos de clonación
        // asegurando la unicidad absoluta requerida por la arquitectura relacional.

        const [existe] = await conn.query(
          'SELECT id_usuario FROM usuario WHERE email = ?',
          [email]
        );
        if (existe.length > 0) {
          return R.conflict(res, 'El correo electrónico ya está registrado');
        }


        // Camuflamos la contraseña en un hash dinámico basado en saltos de procesamiento
        // protegiendo el factor de autenticación frente a fugas de la base de datos.

        const hash = await bcrypt.hash(contrasena, Number(process.env.BCRYPT_ROUNDS) || 10);

        await conn.beginTransaction();

        
    // 1. Insertar usuario

        // Inyectamos la matriz de identidad base mapeando los perfiles (rol)
        // y reteniendo el ID serial entregado para la construcción de los módulos satélite.

        const [userResult] = await conn.query(
          `INSERT INTO usuario (id_rol, nombre, apellido, email, contrasena_hash, fecha_nacimiento)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id_rol, nombre, apellido, email, hash, fecha_nacimiento]
        );
        const id_usuario = userResult.insertId;


    // 2. Crear wallet

        // Acoplamos una billetera virgen a la llave principal del nuevo usuario
        // para dar por inaugurada su participación en la microeconomía del proyecto.

        await conn.query(
          'INSERT INTO wallet (id_usuario) VALUES (?)',
          [id_usuario]
        );


    // 3. Si es estudiante, crear mascota con estado "Excelente" (id_estado = 1)

        // Condicionamos la creación del compañero virtual exclusivamente a los perfiles de estudiantes
        // para que los tutores tengan un panel administrativo limpio sin cruce de mecánicas lúdicas.

        if (Number(id_rol) === 1) {
          await conn.query(
            `INSERT INTO mascota (id_usuario, id_estado) VALUES (?, 1)`,
            [id_usuario]
          );
        }

        await conn.commit();

        // Materializamos el JWT de bienvenida con la estructura predefinida
        // permitiendo que el cliente inicie sesión de golpe sin re-autenticar.
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


        // Rastreamos los metadatos y credenciales encriptadas del solicitante
        // cruzándolos bajo el correo como llave de autenticación principal.

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


        // Frenamos secamente la ejecución si el perfil fue suspendido por administración
        // truncando cualquier riesgo de acceso de cuentas baneadas o irregulares.

        if (!user.activo) {
          return R.unauthorized(res, 'Cuenta desactivada. Contacta con soporte.');
        }


        // Contrastamos la contraseña enviada en crudo contra el hash resguardado
        // validados por el propio encriptador usando el algoritmo criptográfico nativo.

        const passwordOk = await bcrypt.compare(contrasena, user.contrasena_hash);
        if (!passwordOk) {
          return R.unauthorized(res, 'Credenciales incorrectas');
        }


        // Desencadenamos la firma de la nueva sesión inyectando los datos de identidad
        // para empaquetarlos en la cabecera portadora que consumirá el cliente móvil.

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

        // Enlazamos los datos biográficos de raíz con la tabla jerárquica de roles
        // sumando su capital y métricas de billetera mediante intersecciones condicionales (LEFT JOIN).


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