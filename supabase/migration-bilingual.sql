-- Migración: nombres bilingües en pictogramas
-- Ejecutar en Supabase si ya tenés la tabla pic_pictograms con columna "name"

ALTER TABLE pic_pictograms ADD COLUMN IF NOT EXISTS name_es TEXT;
ALTER TABLE pic_pictograms ADD COLUMN IF NOT EXISTS name_en TEXT;

UPDATE pic_pictograms
SET name_es = name
WHERE name_es IS NULL AND name IS NOT NULL;

UPDATE pic_pictograms
SET name_en = name_es
WHERE name_en IS NULL AND name_es IS NOT NULL;

ALTER TABLE pic_pictograms ALTER COLUMN name_es SET NOT NULL;

-- Opcional: eliminar columna legacy cuando todo esté migrado
-- ALTER TABLE pic_pictograms DROP COLUMN name;
