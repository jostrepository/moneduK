-- ============================================================
--  MoneduK — Script Completo Unificado
--  Incluye: esquema + migración de columnas + datos semilla
--  Ejecutar en MySQL Workbench
-- ============================================================

-- Configuración de sesión

SET SQL_SAFE_UPDATES  = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- Base de datos

CREATE DATABASE IF NOT EXISTS railway
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE railway;
-- ============================================================
-- 1. ROLES DE USUARIO
-- ============================================================
CREATE TABLE IF NOT EXISTS rol (
    id_rol        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(30)     NOT NULL,
    descripcion   VARCHAR(150)    NULL,
    PRIMARY KEY (id_rol)
);

-- ============================================================
-- 2. USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_rol              INT UNSIGNED    NOT NULL,
    nombre              VARCHAR(80)     NOT NULL,
    apellido            VARCHAR(80)     NOT NULL,
    email               VARCHAR(120)    NOT NULL UNIQUE,
    contrasena_hash     VARCHAR(255)    NOT NULL,
    fecha_nacimiento    DATE            NULL,
    avatar_url          VARCHAR(255)    NULL,
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    fecha_registro      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
);

-- ============================================================
-- 3. RELACIÓN TUTOR → ESTUDIANTE
-- ============================================================
CREATE TABLE IF NOT EXISTS tutor_estudiante (
    id_tutor        INT UNSIGNED    NOT NULL,
    id_estudiante   INT UNSIGNED    NOT NULL,
    tipo_relacion   VARCHAR(30)     NOT NULL DEFAULT 'padre/madre',
    fecha_vinculo   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_tutor, id_estudiante),
    CONSTRAINT fk_te_tutor      FOREIGN KEY (id_tutor)      REFERENCES usuario (id_usuario),
    CONSTRAINT fk_te_estudiante FOREIGN KEY (id_estudiante) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 4. BILLETERA (KoinK)
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet (
    id_wallet           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario          INT UNSIGNED    NOT NULL UNIQUE,
    saldo               DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_ganado        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_gastado       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    fecha_actualizacion DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_wallet),
    CONSTRAINT fk_wallet_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 5. TIPOS DE TRANSACCIÓN
-- ============================================================
CREATE TABLE IF NOT EXISTS tipo_transaccion (
    id_tipo     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    codigo      VARCHAR(30)     NOT NULL UNIQUE,
    nombre      VARCHAR(60)     NOT NULL,
    es_positivo TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_tipo)
);

-- ============================================================
-- 6. HISTORIAL DE TRANSACCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS transaccion (
    id_transaccion  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_wallet       INT UNSIGNED    NOT NULL,
    id_tipo         INT UNSIGNED    NOT NULL,
    monto           DECIMAL(10,2)   NOT NULL,
    descripcion     VARCHAR(200)    NULL,
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_transaccion),
    CONSTRAINT fk_tx_wallet FOREIGN KEY (id_wallet) REFERENCES wallet (id_wallet),
    CONSTRAINT fk_tx_tipo   FOREIGN KEY (id_tipo)   REFERENCES tipo_transaccion (id_tipo)
);

-- ============================================================
    -- 7. MASCOTAS (CERDITO ALCANCÍA ÚNICAMENTE POR EL MOMENTO)
    -- ============================================================
    CREATE TABLE IF NOT EXISTS estado_mascota (
        id_estado       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
        nombre          VARCHAR(30)     NOT NULL,
        descripcion     VARCHAR(150)    NULL,
        icono_url       VARCHAR(255)    NULL,
        rango_salud_min TINYINT         NOT NULL,
        rango_salud_max TINYINT         NOT NULL,
        PRIMARY KEY (id_estado)
    );

    CREATE TABLE IF NOT EXISTS mascota (
        id_mascota          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
        id_usuario          INT UNSIGNED     NOT NULL UNIQUE,
        nombre              VARCHAR(60)      NOT NULL DEFAULT 'Koinchi',
        nivel               TINYINT UNSIGNED NOT NULL DEFAULT 1,
        salud               TINYINT UNSIGNED NOT NULL DEFAULT 100,
        id_estado           INT UNSIGNED     NOT NULL,
        experiencia         INT UNSIGNED     NOT NULL DEFAULT 0,
        fecha_creacion      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id_mascota),
        CONSTRAINT fk_mascota_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
        CONSTRAINT fk_mascota_estado  FOREIGN KEY (id_estado)  REFERENCES estado_mascota (id_estado)
    );

    -- ============================================================
    -- 8. HISTORIAL DE SALUD DE LA MASCOTA
    -- ============================================================
    CREATE TABLE IF NOT EXISTS historial_mascota (
        id_historial    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
        id_mascota      INT UNSIGNED     NOT NULL,
        salud_anterior  TINYINT UNSIGNED NOT NULL,
        salud_nueva     TINYINT UNSIGNED NOT NULL,
        motivo          VARCHAR(150)     NULL,
        fecha           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_historial),
        CONSTRAINT fk_hm_mascota FOREIGN KEY (id_mascota) REFERENCES mascota (id_mascota)
    );

-- ============================================================
-- 9. CATEGORÍAS DE LECCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS categoria_leccion (
    id_categoria    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(60)     NOT NULL,
    descripcion     VARCHAR(200)    NULL,
    icono_url       VARCHAR(255)    NULL,
    PRIMARY KEY (id_categoria)
);

-- ============================================================
-- 10. LECCIONES / CONTENIDO EDUCATIVO
-- ============================================================
CREATE TABLE IF NOT EXISTS leccion (
    id_leccion      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_categoria    INT UNSIGNED    NOT NULL,
    titulo          VARCHAR(120)    NOT NULL,
    descripcion     VARCHAR(300)    NULL,
    contenido_url   VARCHAR(255)    NULL,
    edad_min        TINYINT         NOT NULL DEFAULT 9,
    edad_max        TINYINT         NOT NULL DEFAULT 16,
    recompensa_koin DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
    recompensa_xp   INT UNSIGNED    NOT NULL DEFAULT 10,
    orden           TINYINT         NOT NULL DEFAULT 1,
    activa          TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_leccion),
    CONSTRAINT fk_leccion_cat FOREIGN KEY (id_categoria) REFERENCES categoria_leccion (id_categoria)
);

-- ============================================================
-- 11. QUIZZES DE LECCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz (
    id_quiz            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_leccion         INT UNSIGNED    NOT NULL,
    pregunta           VARCHAR(300)    NOT NULL,
    opcion_a           VARCHAR(150)    NOT NULL,
    opcion_b           VARCHAR(150)    NOT NULL,
    opcion_c           VARCHAR(150)    NULL,
    opcion_d           VARCHAR(150)    NULL,
    respuesta_correcta CHAR(1)         NOT NULL,
    explicacion        VARCHAR(300)    NULL,
    PRIMARY KEY (id_quiz),
    CONSTRAINT fk_quiz_leccion FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion)
);

-- ============================================================
-- 12. PROGRESO DEL USUARIO EN LECCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS progreso_leccion (
    id_progreso      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario       INT UNSIGNED    NOT NULL,
    id_leccion       INT UNSIGNED    NOT NULL,
    completada       TINYINT(1)      NOT NULL DEFAULT 0,
    puntaje_quiz     TINYINT         NULL,
    fecha_inicio     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completado DATETIME        NULL,
    PRIMARY KEY (id_progreso),
    UNIQUE KEY uq_progreso (id_usuario, id_leccion),
    CONSTRAINT fk_pl_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_pl_leccion FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion)
);

-- ============================================================
-- 13. TIENDA VIRTUAL
-- ============================================================
CREATE TABLE IF NOT EXISTS categoria_producto (
    id_cat_prod INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(60)     NOT NULL,
    PRIMARY KEY (id_cat_prod)
);

CREATE TABLE IF NOT EXISTS producto (
    id_producto INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_cat_prod INT UNSIGNED    NOT NULL,
    nombre      VARCHAR(100)    NOT NULL,
    descripcion VARCHAR(200)    NULL,
    precio_koin DECIMAL(10,2)   NOT NULL,
    imagen_url  VARCHAR(255)    NULL,
    disponible  TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_producto),
    CONSTRAINT fk_prod_cat FOREIGN KEY (id_cat_prod) REFERENCES categoria_producto (id_cat_prod)
);

CREATE TABLE IF NOT EXISTS compra (
    id_compra     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario    INT UNSIGNED    NOT NULL,
    id_producto   INT UNSIGNED    NOT NULL,
    precio_pagado DECIMAL(10,2)   NOT NULL,
    fecha         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_compra),
    CONSTRAINT fk_compra_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuario (id_usuario),
    CONSTRAINT fk_compra_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
);

-- ============================================================
-- 14. TRABAJOS VIRTUALES
--     ► Columnas de migración integradas directamente
-- ============================================================
CREATE TABLE IF NOT EXISTS trabajo (
    id_trabajo        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre            VARCHAR(100)    NOT NULL,
    descripcion       VARCHAR(250)    NULL,
    recompensa_koin   DECIMAL(8,2)    NOT NULL,
    recompensa_xp     INT UNSIGNED    NOT NULL DEFAULT 5,
    duracion_seg      INT UNSIGNED    NULL,
    imagen_url        VARCHAR(255)    NULL,
    activo            TINYINT(1)      NOT NULL DEFAULT 1,
    -- ── columnas de reglas (antes en migración) ───────────
    tiempo_espera_seg INT UNSIGNED    NOT NULL DEFAULT 60
        COMMENT 'Segundos de espera antes de completar (60-300)',
    recompensa_xp_min INT UNSIGNED    NOT NULL DEFAULT 20
        COMMENT 'XP mínimo al completar',
    recompensa_xp_max INT UNSIGNED    NOT NULL DEFAULT 50
        COMMENT 'XP máximo al completar',
    salud_min         TINYINT         NOT NULL DEFAULT 2
        COMMENT 'Puntos de salud mínimos al completar',
    salud_max         TINYINT         NOT NULL DEFAULT 5
        COMMENT 'Puntos de salud máximos al completar',
    dificultad        ENUM('facil','medio','dificil') NOT NULL DEFAULT 'facil',
    PRIMARY KEY (id_trabajo)
);

CREATE TABLE IF NOT EXISTS historial_trabajo (
    id_historial INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario   INT UNSIGNED    NOT NULL,
    id_trabajo   INT UNSIGNED    NOT NULL,
    koin_ganado  DECIMAL(8,2)    NOT NULL,
    fecha        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_historial),
    CONSTRAINT fk_ht_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_ht_trabajo FOREIGN KEY (id_trabajo) REFERENCES trabajo (id_trabajo)
);

-- ============================================================
-- 15. INVERSIONES VIRTUALES
-- ============================================================
CREATE TABLE IF NOT EXISTS tipo_inversion (
    id_tipo_inv     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(60)     NOT NULL,
    descripcion     VARCHAR(200)    NULL,
    rendimiento_pct DECIMAL(5,2)    NOT NULL,
    PRIMARY KEY (id_tipo_inv)
);

CREATE TABLE IF NOT EXISTS inversion (
    id_inversion         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario           INT UNSIGNED    NOT NULL,
    id_tipo_inv          INT UNSIGNED    NOT NULL,
    monto_invertido      DECIMAL(10,2)   NOT NULL,
    rendimiento_esperado DECIMAL(10,2)   NOT NULL,
    fecha_inicio         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento    DATETIME        NOT NULL,
    estado               ENUM('activa','completada','cancelada') NOT NULL DEFAULT 'activa',
    PRIMARY KEY (id_inversion),
    CONSTRAINT fk_inv_usuario FOREIGN KEY (id_usuario)  REFERENCES usuario (id_usuario),
    CONSTRAINT fk_inv_tipo    FOREIGN KEY (id_tipo_inv) REFERENCES tipo_inversion (id_tipo_inv)
);

-- ============================================================
-- 16. APUESTAS / DECISIONES DE RIESGO
-- ============================================================
CREATE TABLE IF NOT EXISTS apuesta (
    id_apuesta      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    monto_apostado  DECIMAL(10,2)   NOT NULL,
    resultado       ENUM('ganó','perdió') NOT NULL,
    monto_resultado DECIMAL(10,2)   NOT NULL,
    leccion_moral   VARCHAR(300)    NULL,
    impacto_salud   TINYINT         NOT NULL DEFAULT -10,
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_apuesta),
    CONSTRAINT fk_apuesta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 17. MISIONES / RETOS FINANCIEROS
--     ► Defaults ya actualizados con valores de migración
-- ============================================================
CREATE TABLE IF NOT EXISTS mision (
    id_mision        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    titulo           VARCHAR(120)    NOT NULL,
    descripcion      VARCHAR(300)    NULL,
    tipo             VARCHAR(40)     NOT NULL,
    meta_cantidad    DECIMAL(10,2)   NULL,
    recompensa_koin  DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
    recompensa_xp    INT UNSIGNED    NOT NULL DEFAULT 1000,
    recompensa_salud TINYINT         NOT NULL DEFAULT 100,
    duracion_dias    INT UNSIGNED    NULL,
    activa           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_mision)
);

CREATE TABLE IF NOT EXISTS mision_usuario (
    id_mu            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario       INT UNSIGNED    NOT NULL,
    id_mision        INT UNSIGNED    NOT NULL,
    progreso         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    completada       TINYINT(1)      NOT NULL DEFAULT 0,
    fecha_asignacion DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completado DATETIME        NULL,
    PRIMARY KEY (id_mu),
    UNIQUE KEY uq_mision_usuario (id_usuario, id_mision),
    CONSTRAINT fk_mu_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_mu_mision  FOREIGN KEY (id_mision)  REFERENCES mision (id_mision)
);

-- ============================================================
-- 18. LOGROS / BADGES
-- ============================================================
CREATE TABLE IF NOT EXISTS logro (
    id_logro    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(80)     NOT NULL,
    descripcion VARCHAR(200)    NULL,
    icono_url   VARCHAR(255)    NULL,
    condicion   VARCHAR(150)    NULL,
    PRIMARY KEY (id_logro)
);

CREATE TABLE IF NOT EXISTS logro_usuario (
    id_lu          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario     INT UNSIGNED    NOT NULL,
    id_logro       INT UNSIGNED    NOT NULL,
    fecha_obtenido DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_lu),
    UNIQUE KEY uq_logro_usuario (id_usuario, id_logro),
    CONSTRAINT fk_lu_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_lu_logro   FOREIGN KEY (id_logro)   REFERENCES logro (id_logro)
);

-- ============================================================
-- 19. SESIONES / TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS sesion (
    id_sesion        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario       INT UNSIGNED    NOT NULL,
    token            VARCHAR(512)    NOT NULL UNIQUE,
    dispositivo      VARCHAR(100)    NULL,
    fecha_creacion   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME        NOT NULL,
    activa           TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_sesion),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 20. DATOS SEMILLA — catálogos base
-- ============================================================

INSERT INTO rol (nombre, descripcion) VALUES
('estudiante', 'Niño o joven entre 9 y 16 años'),
('tutor',      'Padre, madre o tutor legal del estudiante');

INSERT INTO tipo_transaccion (codigo, nombre, es_positivo) VALUES
('ahorro',    'Ahorro',                  1),
('gasto',     'Gasto en tienda',         1),
('trabajo',   'Trabajo virtual',         1),
('inversion', 'Inversión',              1),
('apuesta',   'Apuesta',                0),
('leccion',   'Recompensa por lección', 1),
('mision',    'Recompensa por misión',  1);

INSERT INTO estado_mascota (nombre, descripcion, rango_salud_min, rango_salud_max) VALUES
('Excelente', 'El cerdito está en perfecto estado, lleno de energía', 81, 100),
('Bien',      'El cerdito está saludable y contento',                 61,  80),
('Regular',   'El cerdito empieza a sentirse un poco mal',            41,  60),
('Malo',      'El cerdito está enfermo, necesita atención',           21,  40),
('Crítico',   'El cerdito está muy mal, urgente mejorar hábitos',      0,  20);

INSERT INTO categoria_leccion (nombre, descripcion) VALUES
('Ahorro',      'Aprende a guardar tu dinero para el futuro'),
('Presupuesto', 'Planifica cómo gastar tu dinero sabiamente'),
('Inversión',   'Haz que tu dinero trabaje para ti'),
('Apuestas',    'Por qué apostar puede ser peligroso para tu dinero'),
('Trabajo',     'Cómo ganar dinero con esfuerzo y dedicación');

INSERT INTO categoria_producto (nombre) VALUES
('Accesorios para la mascota'),
('Fondos de pantalla'),
('Marcos de perfil'),
('Efectos especiales');

-- ============================================================
-- 21. DATOS SEMILLA — módulos (trabajos, inversiones, tienda, misiones)
-- ============================================================

INSERT INTO trabajo (nombre, descripcion, recompensa_koin, recompensa_xp, duracion_seg,
                     tiempo_espera_seg, recompensa_xp_min, recompensa_xp_max,
                     salud_min, salud_max, dificultad) VALUES
('Repartidor de periódicos', 'Entrega periódicos por el barrio antes del amanecer',  15.00, 10,  60,  60, 20, 28, 2, 3, 'facil'),
('Vendedor de limonada',     'Monta tu puesto y vende limonada a los vecinos',        20.00, 15,  90,  90, 22, 30, 2, 3, 'facil'),
('Paseo de perros',          'Lleva a pasear a los perritos del vecindario',          25.00, 20, 120, 120, 24, 33, 2, 4, 'facil'),
('Lavado de carros',         'Lava y deja brillando los carros del vecindario',       30.00, 25, 150, 150, 28, 38, 3, 4, 'medio'),
('Jardinería',               'Cuida el jardín: corta el césped y riega las plantas',  35.00, 30, 180, 180, 30, 42, 3, 5, 'medio'),
('Tutor de tareas',          'Ayuda a otros niños con sus tareas escolares',          40.00, 35, 120, 240, 38, 48, 4, 5, 'dificil'),
('Venta de manualidades',    'Crea y vende tus propias manualidades en el mercado',   50.00, 40, 180, 300, 42, 50, 4, 5, 'dificil');

INSERT INTO tipo_inversion (nombre, descripcion, rendimiento_pct) VALUES
('Alcancía segura',  'Guarda tu dinero y recibe un pequeño extra. Bajo riesgo.',  5.00),
('Fondo KoinK',      'Inversión moderada con buen rendimiento a mediano plazo.', 12.00),
('Acciones MoneduK', 'Mayor riesgo, mayor ganancia. Aprende sobre el mercado.',  20.00);

INSERT INTO producto (id_cat_prod, nombre, descripcion, precio_koin) VALUES
(1, 'Sombrero de graduado',   'Tu cerdito luce muy inteligente con este birrete',  50.00),
(1, 'Gafas de sol',           'Para el cerdito más fresco del barrio',              40.00),
(1, 'Corbatín elegante',      'Cuando tu cerdito quiere verse profesional',         35.00),
(1, 'Capa de superhéroe',     'Tu cerdito defensor de las buenas finanzas',         80.00),
(2, 'Fondo ciudad de noche',  'Una hermosa ciudad iluminada de noche',              30.00),
(2, 'Fondo playa tropical',   'Relájate con esta playa paradisíaca',                30.00),
(2, 'Fondo espacio exterior', 'Explora el universo financiero',                     45.00),
(3, 'Marco dorado',           'Para los ahorradores de élite',                      60.00),
(3, 'Marco de arcoíris',      'Colorido y divertido',                               25.00),
(4, 'Confeti al ganar',       'Celebra tus logros con confeti explosivo',           70.00),
(4, 'Monedas flotantes',      'KoinK volando a tu alrededor',                       90.00);

INSERT INTO mision (titulo, descripcion, tipo, meta_cantidad, recompensa_koin, recompensa_xp, recompensa_salud, duracion_dias) VALUES
('Primer ahorro',
 'Ahorra KoinK por primera vez. ¡El primer paso es el más importante!',
 'ahorro', 1, 20, 1000, 100, 7),
('Ahorrador constante',
 'Realiza 5 ahorros diferentes. Los buenos hábitos se construyen con constancia.',
 'ahorro', 5, 50, 1000, 100, 14),
('Trabajador del mes',
 'Completa 3 trabajos virtuales para ganar tu propio dinero.',
 'trabajo', 3, 40, 1000, 100, 7),
('Inversor principiante',
 'Crea tu primera inversión. Aprende cómo el dinero puede crecer solo.',
 'inversion', 1, 35, 1000, 100, 30),
('Sin apuestas por una semana',
 'Pasa 7 días sin realizar apuestas. Tu cerdito te lo agradecerá.',
 'gasto_cero', NULL, 60, 1000, 100, 7),
('Explorador de lecciones',
 'Completa 3 lecciones educativas. El conocimiento es el mejor activo.',
 'leccion', 3, 45, 1000, 100, 14),
('Comprador inteligente',
 'Compra un artículo en la tienda. Gastar bien también es una habilidad.',
 'gasto', 1, 25, 1000, 100, 30),
('Maestro del dinero',
 'Completa todas las misiones anteriores. ¡Eres un experto financiero!',
 'general', NULL, 200, 1000, 100, 60);

-- ============================================================
-- 22. USUARIO Y PERMISOS
-- ============================================================
CREATE USER IF NOT EXISTS 'moneduK'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON moneduK.* TO 'moneduK'@'localhost';
FLUSH PRIVILEGES;

-- Restaurar configuración de sesión

SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES   = 1;

-- ============================================================
-- 23. VERIFICACIÓN FINAL
-- ============================================================
SELECT id_trabajo, nombre, dificultad, tiempo_espera_seg,
       recompensa_xp_min, recompensa_xp_max,
       salud_min, salud_max, recompensa_koin
FROM trabajo ORDER BY tiempo_espera_seg ASC;

SELECT id_mision, titulo, recompensa_koin, recompensa_xp, recompensa_salud
FROM mision;

-- ============================================================
-- FIN DEL SCRIPT UNIFICADO
-- ============================================================

