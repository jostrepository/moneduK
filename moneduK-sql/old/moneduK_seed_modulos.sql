-- ============================================================
--  MoneduK — Datos semilla para módulos nuevos
--  Ejecutar en MySQL Workbench DESPUÉS de moneduK_database.sql
-- ============================================================

USE moneduK;

-- ─── Trabajos virtuales ───────────────────────────────────
INSERT INTO trabajo (nombre, descripcion, recompensa_koin, recompensa_xp, duracion_seg) VALUES
('Repartidor de periódicos',  'Entrega periódicos por el barrio antes del amanecer',    15.00, 10, 60),
('Vendedor de limonada',      'Monta tu puesto y vende limonada a los vecinos',          20.00, 15, 90),
('Paseo de perros',           'Lleva a pasear a los perritos del vecindario',            25.00, 20, 120),
('Lavado de carros',          'Lava y deja brillando los carros del vecindario',         30.00, 25, 150),
('Jardinería',                'Cuida el jardín: corta el césped y riega las plantas',    35.00, 30, 180),
('Tutor de tareas',           'Ayuda a otros niños con sus tareas escolares',            40.00, 35, 120),
('Venta de manualidades',     'Crea y vende tus propias manualidades en el mercado',     50.00, 40, 180);

-- ─── Tipos de inversión ───────────────────────────────────
INSERT INTO tipo_inversion (nombre, descripcion, rendimiento_pct) VALUES
('Alcancía segura',    'Guarda tu dinero y recibe un pequeño extra. Bajo riesgo.',        5.00),
('Fondo KoinK',        'Inversión moderada con buen rendimiento a mediano plazo.',       12.00),
('Acciones MoneduK',   'Mayor riesgo, mayor ganancia. Aprende sobre el mercado.',        20.00);

-- ─── Productos de la tienda ───────────────────────────────
INSERT INTO producto (id_cat_prod, nombre, descripcion, precio_koin) VALUES
-- Accesorios mascota (id_cat_prod = 1)
(1, 'Sombrero de graduado',    'Tu cerdito luce muy inteligente con este birrete',        50.00),
(1, 'Gafas de sol',            'Para el cerdito más fresco del barrio',                   40.00),
(1, 'Corbatín elegante',       'Cuando tu cerdito quiere verse profesional',              35.00),
(1, 'Capa de superhéroe',      'Tu cerdito defensor de las buenas finanzas',              80.00),
-- Fondos de pantalla (id_cat_prod = 2)
(2, 'Fondo ciudad de noche',   'Una hermosa ciudad iluminada de noche',                   30.00),
(2, 'Fondo playa tropical',    'Relájate con esta playa paradisíaca',                     30.00),
(2, 'Fondo espacio exterior',  'Explora el universo financiero',                          45.00),
-- Marcos de perfil (id_cat_prod = 3)
(3, 'Marco dorado',            'Para los ahorradores de élite',                           60.00),
(3, 'Marco de arcoíris',       'Colorido y divertido',                                    25.00),
-- Efectos especiales (id_cat_prod = 4)
(4, 'Confeti al ganar',        'Celebra tus logros con confeti explosivo',                70.00),
(4, 'Monedas flotantes',       'KoinK volando a tu alrededor',                            90.00);

-- ─── Misiones financieras ─────────────────────────────────
INSERT INTO mision (titulo, descripcion, tipo, meta_cantidad, recompensa_koin, recompensa_xp, recompensa_salud, duracion_dias) VALUES
('Primer ahorro',
 'Ahorra KoinK por primera vez. ¡El primer paso es el más importante!',
 'ahorro', 1, 20, 15, 5, 7),

('Ahorrador constante',
 'Realiza 5 ahorros diferentes. Los buenos hábitos se construyen con constancia.',
 'ahorro', 5, 50, 30, 10, 14),

('Trabajador del mes',
 'Completa 3 trabajos virtuales para ganar tu propio dinero.',
 'trabajo', 3, 40, 25, 8, 7),

('Inversor principiante',
 'Crea tu primera inversión. Aprende cómo el dinero puede crecer solo.',
 'inversion', 1, 35, 20, 8, 30),

('Sin apuestas por una semana',
 'Pasa 7 días sin realizar apuestas. Tu cerdito te lo agradecerá.',
 'gasto_cero', NULL, 60, 40, 15, 7),

('Explorador de lecciones',
 'Completa 3 lecciones educativas. El conocimiento es el mejor activo.',
 'leccion', 3, 45, 35, 10, 14),

('Comprador inteligente',
 'Compra un artículo en la tienda. Gastar bien también es una habilidad.',
 'gasto', 1, 25, 15, 5, 30),

('Maestro del dinero',
 'Completa todas las misiones anteriores. ¡Eres un experto financiero!',
 'general', NULL, 200, 100, 25, 60);
