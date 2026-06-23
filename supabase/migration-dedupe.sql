-- Deduplicar pictogramas del sistema y evitar duplicados futuros
-- Ejecutar en Supabase SQL Editor

-- Mantener columna legacy "name" sincronizada
UPDATE pic_pictograms
SET name = name_es
WHERE name IS NULL OR name <> name_es;

-- Eliminar duplicados por categoría (conserva el más antiguo)
DELETE FROM pic_pictograms
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY category_id, lower(trim(name_es))
        ORDER BY created_at ASC, id ASC
      ) AS row_num
    FROM pic_pictograms
    WHERE is_system = true
  ) ranked
  WHERE row_num > 1
);

-- Índice único para pictogramas del sistema
CREATE UNIQUE INDEX IF NOT EXISTS idx_pic_pictograms_system_unique_name
  ON pic_pictograms (category_id, lower(trim(name_es)))
  WHERE is_system = true;
