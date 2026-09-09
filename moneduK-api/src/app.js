require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const { testConnection } = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// ─── Rutas ────────────────────────────────────────────────
const authRoutes     = require('./routes/auth.routes');
const mascotaRoutes  = require('./routes/mascota.routes');
const walletRoutes   = require('./routes/wallet.routes');
const leccionRoutes  = require('./routes/leccion.routes');
const tutorRoutes    = require('./routes/tutor.routes');
const { trabajoRouter } = require('./routes/trabajo.routes');
const apuestaRoutes  = require('./routes/apuesta.routes');
const inversionRoutes = require('./routes/inversion.routes');
const tiendaRoutes   = require('./routes/tienda.routes');
const misionRoutes   = require('./routes/mision.routes');
const minijuegoRoutes = require('./routes/minijuego.routes');
const mlRoutes = require('./routes/ml.routes');
const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ─────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/ml', mlRoutes);

// ─── Health check ─────────────────────────────────────────
app.get('/health', (_, res) =>
  res.json({ success: true, message: 'MoneduK API corriendo 🐷' })
);

// ─── Rutas de la API ──────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/mascota',    mascotaRoutes);
app.use('/api/wallet',     walletRoutes);
app.use('/api/lecciones',  leccionRoutes);
app.use('/api/tutor',      tutorRoutes);
app.use('/api/trabajos',   trabajoRouter);
app.use('/api/apuestas',   apuestaRoutes);
app.use('/api/inversiones', inversionRoutes);
app.use('/api/tienda',     tiendaRoutes);
app.use('/api/misiones',   misionRoutes);
app.use('/api/minijuegos', minijuegoRoutes);
app.use('/api/ml',         mlRoutes);


//Manejo de errores 

    app.use(notFoundHandler);
    app.use(errorHandler);

// Arranque 

    (async () => {
      await testConnection();
      app.listen(PORT, () => {
        console.log(`🚀  MoneduK API escuchando en http://localhost:${PORT}`);
        console.log(`📋  Ambiente: ${process.env.NODE_ENV || 'development'}`);
      });
    })();
