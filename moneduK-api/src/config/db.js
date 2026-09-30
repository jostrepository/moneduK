const mysql = require('mysql2/promise');


    // Inicializamos el gestor de conexiones a la base de datos utilizando un pool
    // para optimizar el rendimiento y reutilizar los hilos en peticiones concurrentes.

    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'moneduK',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: 'Z',
    });


    // Verificamos la disponibilidad del servidor de base de datos durante el arranque
    // abortando el proceso inmediatamente si no es posible establecer comunicación.

    async function testConnection() {
      try {
        const conn = await pool.getConnection();
        console.log('✅  MySQL conectado correctamente');
        conn.release();
      } catch (err) {
        console.error('❌  Error conectando a MySQL:', err.message);
        process.exit(1);
      }
  }

  module.exports = { pool, testConnection };