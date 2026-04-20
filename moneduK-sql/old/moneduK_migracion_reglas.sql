-- ============================================================
--  MoneduK — Migración: nuevas reglas de trabajos y misiones
--  Ejecutar en MySQL Workbench
-- ============================================================

USE moneduK;

-- ── 1. Agregar columnas a la tabla trabajo ────────────────
DROP PROCEDURE IF EXISTS agregar_columna_si_no_existe;

DELIMITER $$
CREATE PROCEDURE agregar_columna_si_no_existe(
  IN p_tabla VARCHAR(64),
  IN p_columna VARCHAR(64),
  IN p_definicion TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = p_tabla
      AND COLUMN_NAME  = p_columna
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tabla, '` ADD COLUMN `', p_columna, '` ', p_definicion);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- Llamar para cada columna
CALL agregar_columna_si_no_existe('trabajo', 'tiempo_espera_seg',  'INT UNSIGNED NOT NULL DEFAULT 60 COMMENT "Segundos de espera"');
CALL agregar_columna_si_no_existe('trabajo', 'recompensa_xp_min',  'INT UNSIGNED NOT NULL DEFAULT 20 COMMENT "XP mínimo"');
CALL agregar_columna_si_no_existe('trabajo', 'recompensa_xp_max',  'INT UNSIGNED NOT NULL DEFAULT 50 COMMENT "XP máximo"');
CALL agregar_columna_si_no_existe('trabajo', 'salud_min',          'TINYINT NOT NULL DEFAULT 2 COMMENT "Salud mínima"');
CALL agregar_columna_si_no_existe('trabajo', 'salud_max',          'TINYINT NOT NULL DEFAULT 5 COMMENT "Salud máxima"');
CALL agregar_columna_si_no_existe('trabajo', 'dificultad',         'ENUM(''facil'',''medio'',''dificil'') NOT NULL DEFAULT ''facil''');

DROP PROCEDURE IF EXISTS agregar_columna_si_no_existe;

-- ── 2. Actualizar trabajos existentes con nuevos valores ──
-- Repartidor de periódicos — Fácil (1 min espera)
UPDATE trabajo SET
  tiempo_espera_seg = 60,
  recompensa_xp_min = 20, recompensa_xp_max = 28,
  salud_min = 2, salud_max = 3,
  dificultad = 'facil'
WHERE nombre = 'Repartidor de periódicos';

-- Vendedor de limonada — Fácil (1.5 min)
UPDATE trabajo SET
  tiempo_espera_seg = 90,
  recompensa_xp_min = 22, recompensa_xp_max = 30,
  salud_min = 2, salud_max = 3,
  dificultad = 'facil'
WHERE nombre = 'Vendedor de limonada';

-- Paseo de perros — Fácil (2 min)
UPDATE trabajo SET
  tiempo_espera_seg = 120,
  recompensa_xp_min = 24, recompensa_xp_max = 33,
  salud_min = 2, salud_max = 4,
  dificultad = 'facil'
WHERE nombre = 'Paseo de perros';

-- Lavado de carros — Medio (2.5 min)
UPDATE trabajo SET
  tiempo_espera_seg = 150,
  recompensa_xp_min = 28, recompensa_xp_max = 38,
  salud_min = 3, salud_max = 4,
  dificultad = 'medio'
WHERE nombre = 'Lavado de carros';

-- Jardinería — Medio (3 min)
UPDATE trabajo SET
  tiempo_espera_seg = 180,
  recompensa_xp_min = 30, recompensa_xp_max = 42,
  salud_min = 3, salud_max = 5,
  dificultad = 'medio'
WHERE nombre = 'Jardinería';

-- Tutor de tareas — Difícil (4 min)
UPDATE trabajo SET
  tiempo_espera_seg = 240,
  recompensa_xp_min = 38, recompensa_xp_max = 48,
  salud_min = 4, salud_max = 5,
  dificultad = 'dificil'
WHERE nombre = 'Tutor de tareas';

-- Venta de manualidades — Difícil (5 min)
UPDATE trabajo SET
  tiempo_espera_seg = 300,
  recompensa_xp_min = 42, recompensa_xp_max = 50,
  salud_min = 4, salud_max = 5,
  dificultad = 'dificil'
WHERE nombre = 'Venta de manualidades';

-- ── 3. Actualizar recompensas de misiones ─────────────────
-- Las misiones ahora otorgan 1000 XP y 100 salud (gestionado en el controlador)
-- Solo actualizamos los campos de recompensa en la tabla para consistencia
UPDATE mision SET recompensa_xp = 1000, recompensa_salud = 100;

-- ── 4. Verificar cambios ──────────────────────────────────
SELECT id_trabajo, nombre, dificultad, tiempo_espera_seg,
       recompensa_xp_min, recompensa_xp_max,
       salud_min, salud_max, recompensa_koin
FROM trabajo ORDER BY tiempo_espera_seg ASC;

SELECT id_mision, titulo, recompensa_koin, recompensa_xp, recompensa_salud
FROM mision;
