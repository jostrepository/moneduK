// Cliente HTTP centralizado (axios) apuntando a https://moneduk-production.up.railway.app/api.
// (Cómo el servicio en la nube agotó su tiempo limite gratuito, por el momento se seguirá manteniendo en local, 
// el servicio en railway de igual manera se mantendrá comentado).
// Request: inyecta automáticamente el JWT (Bearer token) en cada petición desde AsyncStorage
// Response: si recibe un 401 (token inválido/expirado), borra la sesión guardada automáticamente
// Luego exporta un servicio por módulo de negocio (authService, mascotaService, walletService, leccionService, trabajoService, inversionService,
// apuestaService, tiendaService, misionService), cada uno agrupando los endpoints REST correspondientes. 
// Básicamente esto es lo que consumen todas las pantallas.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

    const BASE_URL = 'http://192.168.20.4:3000/api';

    //const BASE_URL = 'https://endorse-elusive-hardhat.ngrok-free.dev/api';

    //const BASE_URL = 'https://moneduk-production.up.railway.app/api';


  // Centralizamos la configuración del cliente HTTP definiendo las variables estáticas
  // para unificar el dominio base y estandarizar las cabeceras de todas las solicitudes.

    const api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

// Interceptor: adjunta el token JWT a cada petición

  // Interceptamos la salida de las peticiones para incrustar el token de autenticación
  // asegurando que las solicitudes lleven la firma digital del usuario si existe sesión.

    api.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('token');
      
      if (token) config.headers.Authorization = `Bearer ${token}`;
      
      return config;
    });

// Interceptor: manejo global de errores

  // Monitoreamos las respuestas del servidor para detectar fallos de autorización
  // purgando el almacenamiento local automáticamente si el JWT fue revocado o expiró.

    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.multiRemove(['token', 'usuario']);
        }
        return Promise.reject(error);
      }
    );

// Auth 

  // Agrupamos las llamadas a la red relacionadas con la gestión de usuarios
  // exportando métodos limpios que abstraen las rutas y las estructuras de los bodies.

    export const authService = {
      register: (data: {
        nombre: string; apellido: string; email: string;
        contrasena: string; id_rol?: number; fecha_nacimiento?: string;
      }) => api.post('/auth/register', data),

      login: (email: string, contrasena: string) =>
        api.post('/auth/login', { email, contrasena }),

      me: () => api.get('/auth/me'),
  };

// Mascota 

    export const mascotaService = {
      getMiMascota: () => api.get('/mascota'),
      getHistorial: () => api.get('/mascota/historial'),
      aplicarImpacto: (delta: number, motivo: string) =>
        api.patch('/mascota/impacto', { delta, motivo }),
      renombrar: (nombre: string) =>
        api.patch('/mascota/nombre', { nombre }),
  };

// Billetera

    export const walletService = {
      getMiWallet: () => api.get('/wallet'),
      getTransacciones:  (limit = 20, offset = 0) =>
        api.get(`/wallet/transacciones?limit=${limit}&offset=${offset}`),
      registrarTransaccion: (id_tipo: number, monto: number, descripcion: string) =>
        api.post('/wallet/transaccion', { id_tipo, monto, descripcion }),
  };

// Lecciones 

    export const leccionService = {
      getLecciones: () => api.get('/lecciones'),
      getLeccion: (id: number) => api.get(`/lecciones/${id}`),
      completarLeccion: (id: number, puntaje_quiz: number) =>
        api.post(`/lecciones/${id}/completar`, { puntaje_quiz }),
  };

// Trabajos

    export const trabajoService = {
      getTrabajos: () => api.get('/trabajos'),
      completarTrabajo: (id: number) => api.post(`/trabajos/${id}/completar`),
      getHistorial: () => api.get('/trabajos/historial'),
  };

// Inversiones

    export const inversionService = {
      getTipos: () => api.get('/inversiones/tipos'),
      getMisInversiones: () => api.get('/inversiones'),
      crearInversion: (id_tipo_inv: number, monto: number) =>
        api.post('/inversiones', { id_tipo_inv, monto }),
      cobrarInversion: (id: number) => api.post(`/inversiones/${id}/cobrar`),
  };

// Apuestas

    export const apuestaService = {
      realizarApuesta: (monto: number) => api.post('/apuestas', { monto }),
      getHistorial: () => api.get('/apuestas/historial'),
  };

// Tienda

export const tiendaService = {
  getProductos: () => api.get('/tienda'),
  comprar: (id_producto: number) => api.post('/tienda/comprar', { id_producto }),
  getMisCompras: () => api.get('/tienda/mis-compras'),
  equipar: (id_compra: number, equipar: boolean) => api.patch('/tienda/equipar', { id_compra, equipar }),
};

// Misiones

    export const misionService = {
      getMisiones: () => api.get('/misiones'),
      iniciarMision: (id: number) => api.post(`/misiones/${id}/iniciar`),
      actualizarProgreso: (id: number, incremento: number) =>
        api.patch(`/misiones/${id}/progreso`, { incremento }),
  };

  export default api;