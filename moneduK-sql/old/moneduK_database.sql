-- ============================================================
--  MoneduK - Base de Datos MySQL Workbench
--  Proyecto de Grado | Aplicación de Educación Financiera
--  para Niños y Jóvenes (9-16 años)
-- ============================================================

CREATE DATABASE IF NOT EXISTS moneduK
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE moneduK;

-- ============================================================
-- 1. ROLES DE USUARIO
-- ============================================================
CREATE TABLE rol (
    id_rol        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(30)     NOT NULL,          -- 'estudiante', 'tutor'
    descripcion   VARCHAR(150)    NULL,
    PRIMARY KEY (id_rol)
);

-- ============================================================
-- 2. USUARIOS  (tutores y estudiantes comparten tabla)
-- ============================================================
CREATE TABLE usuario (
    id_usuario        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_rol            INT UNSIGNED    NOT NULL,
    nombre            VARCHAR(80)     NOT NULL,
    apellido          VARCHAR(80)     NOT NULL,
    email             VARCHAR(120)    NOT NULL UNIQUE,
    contrasena_hash   VARCHAR(255)    NOT NULL,
    fecha_nacimiento  DATE            NULL,           -- para calcular edad
    avatar_url        VARCHAR(255)    NULL,
    activo            TINYINT(1)      NOT NULL DEFAULT 1,
    fecha_registro    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol)
);

-- ============================================================
-- 3. RELACIÓN TUTOR → ESTUDIANTE
-- ============================================================
CREATE TABLE tutor_estudiante (
    id_tutor        INT UNSIGNED    NOT NULL,
    id_estudiante   INT UNSIGNED    NOT NULL,
    tipo_relacion   VARCHAR(30)     NOT NULL DEFAULT 'padre/madre',  -- padre, madre, tutor legal, etc.
    fecha_vinculo   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_tutor, id_estudiante),
    CONSTRAINT fk_te_tutor      FOREIGN KEY (id_tutor)      REFERENCES usuario (id_usuario),
    CONSTRAINT fk_te_estudiante FOREIGN KEY (id_estudiante) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 4. MONEDA VIRTUAL (KoinK) — WALLET DEL USUARIO
-- ============================================================
CREATE TABLE wallet (
    id_wallet       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL UNIQUE,
    saldo           DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_ganado    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    total_gastado   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_wallet),
    CONSTRAINT fk_wallet_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 5. TIPOS DE TRANSACCIÓN
-- ============================================================
CREATE TABLE tipo_transaccion (
    id_tipo         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    codigo          VARCHAR(30)     NOT NULL UNIQUE, -- 'ahorro', 'gasto', 'trabajo', 'inversion', 'apuesta', 'leccion', 'mision'
    nombre          VARCHAR(60)     NOT NULL,
    es_positivo     TINYINT(1)      NOT NULL DEFAULT 1,  -- 1 = buena decisión, 0 = mala
    PRIMARY KEY (id_tipo)
);

-- ============================================================
-- 6. HISTORIAL DE TRANSACCIONES
-- ============================================================
CREATE TABLE transaccion (
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
-- 7. MASCOTAS (CERDITO ALCANCÍA)
-- ============================================================
CREATE TABLE estado_mascota (
    id_estado       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(30)     NOT NULL,   -- 'excelente', 'bien', 'regular', 'malo', 'critico'
    descripcion     VARCHAR(150)    NULL,
    icono_url       VARCHAR(255)    NULL,        -- asset visual del cerdito en ese estado
    rango_salud_min TINYINT         NOT NULL,   -- ej. 80
    rango_salud_max TINYINT         NOT NULL,   -- ej. 100
    PRIMARY KEY (id_estado)
);

CREATE TABLE mascota (
    id_mascota      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL UNIQUE,
    nombre          VARCHAR(60)     NOT NULL DEFAULT 'Koinchi',
    nivel           TINYINT UNSIGNED NOT NULL DEFAULT 1,       -- 1 a 10
    salud           TINYINT UNSIGNED NOT NULL DEFAULT 100,     -- 0 a 100
    id_estado       INT UNSIGNED    NOT NULL,
    experiencia     INT UNSIGNED    NOT NULL DEFAULT 0,
    fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_mascota),
    CONSTRAINT fk_mascota_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_mascota_estado  FOREIGN KEY (id_estado)  REFERENCES estado_mascota (id_estado)
);

-- ============================================================
-- 8. HISTORIAL DE SALUD DE LA MASCOTA
-- ============================================================
CREATE TABLE historial_mascota (
    id_historial    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_mascota      INT UNSIGNED    NOT NULL,
    salud_anterior  TINYINT UNSIGNED NOT NULL,
    salud_nueva     TINYINT UNSIGNED NOT NULL,
    motivo          VARCHAR(150)    NULL,        -- ej. 'Completó lección #3'
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_historial),
    CONSTRAINT fk_hm_mascota FOREIGN KEY (id_mascota) REFERENCES mascota (id_mascota)
);

-- ============================================================
-- 9. CATEGORÍAS DE LECCIONES
-- ============================================================
CREATE TABLE categoria_leccion (
    id_categoria    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(60)     NOT NULL,   -- 'Ahorro', 'Inversión', 'Presupuesto', etc.
    descripcion     VARCHAR(200)    NULL,
    icono_url       VARCHAR(255)    NULL,
    PRIMARY KEY (id_categoria)
);

-- ============================================================
-- 10. LECCIONES / CONTENIDO EDUCATIVO
-- ============================================================
CREATE TABLE leccion (
    id_leccion      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_categoria    INT UNSIGNED    NOT NULL,
    titulo          VARCHAR(120)    NOT NULL,
    descripcion     VARCHAR(300)    NULL,
    contenido_url   VARCHAR(255)    NULL,        -- vídeo, imagen, texto enriquecido
    edad_min        TINYINT         NOT NULL DEFAULT 9,
    edad_max        TINYINT         NOT NULL DEFAULT 16,
    recompensa_koin DECIMAL(8,2)    NOT NULL DEFAULT 0.00,  -- KoinK por completar
    recompensa_xp   INT UNSIGNED    NOT NULL DEFAULT 10,
    orden           TINYINT         NOT NULL DEFAULT 1,
    activa          TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_leccion),
    CONSTRAINT fk_leccion_cat FOREIGN KEY (id_categoria) REFERENCES categoria_leccion (id_categoria)
);

-- ============================================================
-- 11. QUIZZES DE LECCIONES
-- ============================================================
CREATE TABLE quiz (
    id_quiz         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_leccion      INT UNSIGNED    NOT NULL,
    pregunta        VARCHAR(300)    NOT NULL,
    opcion_a        VARCHAR(150)    NOT NULL,
    opcion_b        VARCHAR(150)    NOT NULL,
    opcion_c        VARCHAR(150)    NULL,
    opcion_d        VARCHAR(150)    NULL,
    respuesta_correcta CHAR(1)      NOT NULL,  -- 'A', 'B', 'C' o 'D'
    explicacion     VARCHAR(300)    NULL,
    PRIMARY KEY (id_quiz),
    CONSTRAINT fk_quiz_leccion FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion)
);

-- ============================================================
-- 12. PROGRESO DEL USUARIO EN LECCIONES
-- ============================================================
CREATE TABLE progreso_leccion (
    id_progreso     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_leccion      INT UNSIGNED    NOT NULL,
    completada      TINYINT(1)      NOT NULL DEFAULT 0,
    puntaje_quiz    TINYINT         NULL,        -- % de respuestas correctas
    fecha_inicio    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completado DATETIME       NULL,
    PRIMARY KEY (id_progreso),
    UNIQUE KEY uq_progreso (id_usuario, id_leccion),
    CONSTRAINT fk_pl_usuario  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_pl_leccion  FOREIGN KEY (id_leccion) REFERENCES leccion (id_leccion)
);

-- ============================================================
-- 13. TIENDA VIRTUAL
-- ============================================================
CREATE TABLE categoria_producto (
    id_cat_prod     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(60)     NOT NULL,   -- 'Accesorios mascota', 'Fondo pantalla', etc.
    PRIMARY KEY (id_cat_prod)
);

CREATE TABLE producto (
    id_producto     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_cat_prod     INT UNSIGNED    NOT NULL,
    nombre          VARCHAR(100)    NOT NULL,
    descripcion     VARCHAR(200)    NULL,
    precio_koin     DECIMAL(10,2)   NOT NULL,
    imagen_url      VARCHAR(255)    NULL,
    disponible      TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_producto),
    CONSTRAINT fk_prod_cat FOREIGN KEY (id_cat_prod) REFERENCES categoria_producto (id_cat_prod)
);

CREATE TABLE compra (
    id_compra       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_producto     INT UNSIGNED    NOT NULL,
    precio_pagado   DECIMAL(10,2)   NOT NULL,
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_compra),
    CONSTRAINT fk_compra_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuario (id_usuario),
    CONSTRAINT fk_compra_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto)
);

-- ============================================================
-- 14. TRABAJOS VIRTUALES (para ganar KoinK)
-- ============================================================
CREATE TABLE trabajo (
    id_trabajo      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    descripcion     VARCHAR(250)    NULL,
    recompensa_koin DECIMAL(8,2)    NOT NULL,
    recompensa_xp   INT UNSIGNED    NOT NULL DEFAULT 5,
    duracion_seg    INT UNSIGNED    NULL,        -- duración estimada del mini-juego
    imagen_url      VARCHAR(255)    NULL,
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_trabajo)
);

CREATE TABLE historial_trabajo (
    id_historial    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_trabajo      INT UNSIGNED    NOT NULL,
    koin_ganado     DECIMAL(8,2)    NOT NULL,
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_historial),
    CONSTRAINT fk_ht_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_ht_trabajo FOREIGN KEY (id_trabajo) REFERENCES trabajo (id_trabajo)
);

-- ============================================================
-- 15. INVERSIONES VIRTUALES
-- ============================================================
CREATE TABLE tipo_inversion (
    id_tipo_inv     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(60)     NOT NULL,   -- 'Fondo de ahorro', 'Acciones KoinK', etc.
    descripcion     VARCHAR(200)    NULL,
    rendimiento_pct DECIMAL(5,2)    NOT NULL,   -- % de rendimiento al vencer
    PRIMARY KEY (id_tipo_inv)
);

CREATE TABLE inversion (
    id_inversion    INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_tipo_inv     INT UNSIGNED    NOT NULL,
    monto_invertido DECIMAL(10,2)   NOT NULL,
    rendimiento_esperado DECIMAL(10,2) NOT NULL,
    fecha_inicio    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATETIME      NOT NULL,
    estado          ENUM('activa','completada','cancelada') NOT NULL DEFAULT 'activa',
    PRIMARY KEY (id_inversion),
    CONSTRAINT fk_inv_usuario  FOREIGN KEY (id_usuario)   REFERENCES usuario (id_usuario),
    CONSTRAINT fk_inv_tipo     FOREIGN KEY (id_tipo_inv)  REFERENCES tipo_inversion (id_tipo_inv)
);

-- ============================================================
-- 16. APUESTAS / DECISIONES DE RIESGO (educativo: enseña que está mal)
-- ============================================================
CREATE TABLE apuesta (
    id_apuesta      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    monto_apostado  DECIMAL(10,2)   NOT NULL,
    resultado       ENUM('ganó','perdió') NOT NULL,
    monto_resultado DECIMAL(10,2)   NOT NULL,   -- lo que ganó o perdió
    leccion_moral   VARCHAR(300)    NULL,        -- mensaje educativo mostrado al usuario
    impacto_salud   TINYINT         NOT NULL DEFAULT -10,  -- siempre negativo para la mascota
    fecha           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_apuesta),
    CONSTRAINT fk_apuesta_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 17. MISIONES / RETOS FINANCIEROS
-- ============================================================
CREATE TABLE mision (
    id_mision       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    titulo          VARCHAR(120)    NOT NULL,
    descripcion     VARCHAR(300)    NULL,
    tipo            VARCHAR(40)     NOT NULL,    -- 'ahorro', 'gasto_cero', 'trabajo', 'inversion', etc.
    meta_cantidad   DECIMAL(10,2)   NULL,        -- meta en KoinK si aplica
    recompensa_koin DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
    recompensa_xp   INT UNSIGNED    NOT NULL DEFAULT 20,
    recompensa_salud TINYINT        NOT NULL DEFAULT 5,  -- +salud a la mascota
    duracion_dias   INT UNSIGNED    NULL,
    activa          TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_mision)
);

CREATE TABLE mision_usuario (
    id_mu           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_mision       INT UNSIGNED    NOT NULL,
    progreso        DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    completada      TINYINT(1)      NOT NULL DEFAULT 0,
    fecha_asignacion DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_completado DATETIME       NULL,
    PRIMARY KEY (id_mu),
    UNIQUE KEY uq_mision_usuario (id_usuario, id_mision),
    CONSTRAINT fk_mu_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_mu_mision  FOREIGN KEY (id_mision)  REFERENCES mision (id_mision)
);

-- ============================================================
-- 18. LOGROS / BADGES
-- ============================================================
CREATE TABLE logro (
    id_logro        INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(80)     NOT NULL,
    descripcion     VARCHAR(200)    NULL,
    icono_url       VARCHAR(255)    NULL,
    condicion       VARCHAR(150)    NULL,        -- descripción de la condición para obtenerlo
    PRIMARY KEY (id_logro)
);

CREATE TABLE logro_usuario (
    id_lu           INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    id_logro        INT UNSIGNED    NOT NULL,
    fecha_obtenido  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_lu),
    UNIQUE KEY uq_logro_usuario (id_usuario, id_logro),
    CONSTRAINT fk_lu_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_lu_logro   FOREIGN KEY (id_logro)   REFERENCES logro (id_logro)
);

-- ============================================================
-- 19. SESIONES / TOKENS (para autenticación MVP)
-- ============================================================
CREATE TABLE sesion (
    id_sesion       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    id_usuario      INT UNSIGNED    NOT NULL,
    token           VARCHAR(512)    NOT NULL UNIQUE,
    dispositivo     VARCHAR(100)    NULL,
    fecha_creacion  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME       NOT NULL,
    activa          TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id_sesion),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
);

-- ============================================================
-- 20. DATOS SEMILLA INICIALES
-- ============================================================

-- Roles
INSERT INTO rol (nombre, descripcion) VALUES
('estudiante', 'Niño o joven entre 9 y 16 años'),
('tutor',      'Padre, madre o tutor legal del estudiante');

-- Tipos de transacción
INSERT INTO tipo_transaccion (codigo, nombre, es_positivo) VALUES
('ahorro',    'Ahorro',                   1),
('gasto',     'Gasto en tienda',          1),  -- gasto consciente es neutro/positivo
('trabajo',   'Trabajo virtual',          1),
('inversion', 'Inversión',               1),
('apuesta',   'Apuesta',                 0),
('leccion',   'Recompensa por lección',  1),
('mision',    'Recompensa por misión',   1);

-- Estados de la mascota
INSERT INTO estado_mascota (nombre, descripcion, rango_salud_min, rango_salud_max) VALUES
('Excelente', 'El cerdito está en perfecto estado, lleno de energía',  81, 100),
('Bien',      'El cerdito está saludable y contento',                  61, 80),
('Regular',   'El cerdito empieza a sentirse un poco mal',             41, 60),
('Malo',      'El cerdito está enfermo, necesita atención',            21, 40),
('Crítico',   'El cerdito está muy mal, urgente mejorar hábitos',       0, 20);

-- Categorías de lección
INSERT INTO categoria_leccion (nombre, descripcion) VALUES
('Ahorro',       'Aprende a guardar tu dinero para el futuro'),
('Presupuesto',  'Planifica cómo gastar tu dinero sabiamente'),
('Inversión',    'Haz que tu dinero trabaje para ti'),
('Apuestas',     'Por qué apostar puede ser peligroso para tu dinero'),
('Trabajo',      'Cómo ganar dinero con esfuerzo y dedicación');

-- Categorías de producto
INSERT INTO categoria_producto (nombre) VALUES
('Accesorios para la mascota'),
('Fondos de pantalla'),
('Marcos de perfil'),
('Efectos especiales');

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================


SELECT user, host FROM mysql.user;

CREATE USER 'moneduK'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON moneduK.* TO 'moneduK'@'localhost';
FLUSH PRIVILEGES;