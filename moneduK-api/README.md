# MoneduK API

API REST para la aplicación móvil MoneduK — educación financiera gamificada para niños y jóvenes.

**Stack:** Node.js · Express · MySQL2 · JWT · bcryptjs · express-validator

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env
# → Edita .env con tus credenciales de MySQL y JWT_SECRET

# 3. Ejecutar la base de datos
# Importa el archivo moneduK_database.sql en MySQL Workbench

# 4. Arrancar en desarrollo
npm run dev

# 5. Arrancar en producción
npm start
```

---

## Estructura del proyecto

```
src/
├── app.js                  ← Entrada principal, configuración Express
├── config/
│   └── db.js               ← Pool de conexiones MySQL
├── controllers/
│   ├── authController.js   ← Registro, login, perfil
│   ├── mascotaController.js← Estado mascota, impactos, historial
│   ├── walletController.js ← Saldo, transacciones
│   ├── leccionController.js← Lecciones, quiz, completar
│   └── tutorController.js  ← Panel tutor, vincular estudiante
├── routes/
│   ├── auth.routes.js
│   ├── mascota.routes.js
│   ├── wallet.routes.js
│   ├── leccion.routes.js
│   └── tutor.routes.js
├── middlewares/
│   ├── auth.js             ← JWT authMiddleware + tutorOnly
│   ├── validate.js         ← express-validator runner
│   └── errorHandler.js     ← 404 + error global
└── utils/
    └── response.js         ← Helpers de respuesta JSON estandarizada
```

---

## Endpoints

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

### Autenticación `/api/auth`

| Método | Ruta          | Auth | Descripción                        |
|--------|---------------|------|------------------------------------|
| POST   | `/register`   | ✗    | Registro de usuario                |
| POST   | `/login`      | ✗    | Inicio de sesión                   |
| GET    | `/me`         | ✓    | Perfil del usuario autenticado     |

#### POST `/api/auth/register`
```json
{
  "nombre": "Sofía",
  "apellido": "Ramírez",
  "email": "sofia@email.com",
  "contrasena": "mi_clave_123",
  "id_rol": 1,
  "fecha_nacimiento": "2012-05-14"
}
```
- `id_rol`: `1` = estudiante (default), `2` = tutor
- Si es estudiante, se crean automáticamente su **wallet** y su **mascota**

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": { "token": "eyJ...", "id_usuario": 1 }
}
```

#### POST `/api/auth/login`
```json
{ "email": "sofia@email.com", "contrasena": "mi_clave_123" }
```

---

### Mascota `/api/mascota` 🐷

| Método | Ruta          | Descripción                              |
|--------|---------------|------------------------------------------|
| GET    | `/`           | Estado actual de la mascota              |
| GET    | `/historial`  | Últimos 50 cambios de salud              |
| PATCH  | `/impacto`    | Aplicar impacto positivo o negativo      |
| PATCH  | `/nombre`     | Renombrar la mascota                     |

#### PATCH `/api/mascota/impacto`
```json
{ "delta": 10, "motivo": "Completó módulo de ahorro" }
```
- `delta` positivo → buena decisión (sube salud)
- `delta` negativo → mala decisión (baja salud)
- Salud se mantiene entre 0 y 100

---

### Wallet (KoinK) `/api/wallet` 💰

| Método | Ruta                | Descripción                         |
|--------|---------------------|-------------------------------------|
| GET    | `/`                 | Saldo actual                        |
| GET    | `/transacciones`    | Historial paginado (`?limit&offset`) |
| POST   | `/transaccion`      | Registrar movimiento de KoinK       |

#### POST `/api/wallet/transaccion`
```json
{ "id_tipo": 1, "monto": 50, "descripcion": "Ahorro semanal" }
```

**Tipos de transacción:**
| id | código     | tipo        |
|----|------------|-------------|
| 1  | ahorro     | positivo ✅  |
| 2  | gasto      | positivo ✅  |
| 3  | trabajo    | positivo ✅  |
| 4  | inversion  | positivo ✅  |
| 5  | apuesta    | negativo ❌  |
| 6  | leccion    | positivo ✅  |
| 7  | mision     | positivo ✅  |

---

### Lecciones `/api/lecciones` 📚

| Método | Ruta                  | Descripción                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/`                   | Lista de lecciones con progreso      |
| GET    | `/:id`                | Detalle + preguntas del quiz         |
| POST   | `/:id/completar`      | Marcar completada y recibir premio   |

#### POST `/api/lecciones/:id/completar`
```json
{ "puntaje_quiz": 80 }
```
Al completar una lección:
- Se acreditan **KoinK** a la wallet
- Se suman **XP** a la mascota
- La **salud** de la mascota sube +5
- Se registra el historial

---

### Tutor `/api/tutor` 👨‍👩‍👧

Solo accesible por usuarios con `id_rol = 2`.

| Método | Ruta                          | Descripción                        |
|--------|-------------------------------|------------------------------------|
| GET    | `/estudiantes`                | Lista de estudiantes vinculados    |
| POST   | `/vincular`                   | Vincular estudiante por email      |
| GET    | `/estudiantes/:id/resumen`    | Resumen de actividad del estudiante|

#### POST `/api/tutor/vincular`
```json
{ "email_estudiante": "sofia@email.com", "tipo_relacion": "padre/madre" }
```

---

## Formato de respuesta

Todas las respuestas siguen este formato:

```json
// Éxito
{ "success": true,  "message": "OK",      "data": { ... } }

// Error
{ "success": false, "message": "...",     "errors": [ ... ] }
```

---

## Estados de la mascota

| Estado    | Salud   | Descripción                              |
|-----------|---------|------------------------------------------|
| Excelente | 81–100  | El cerdito está en perfecto estado 🐷✨   |
| Bien      | 61–80   | El cerdito está saludable y contento     |
| Regular   | 41–60   | Empieza a sentirse un poco mal           |
| Malo      | 21–40   | Necesita atención urgente                |
| Crítico   | 0–20    | Muy mal, hay que mejorar los hábitos     |

---

## Próximos módulos a implementar

- `POST /api/trabajos/:id/completar` — trabajos virtuales
- `POST /api/inversiones` — crear inversión
- `POST /api/apuestas` — registrar apuesta (con impacto negativo forzado)
- `GET/POST /api/misiones` — retos financieros
- `GET /api/tienda` + `POST /api/tienda/comprar` — tienda virtual
