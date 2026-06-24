-- Marcar pictogramas creados o editados por el usuario
ALTER TABLE pic_pictograms
  ADD COLUMN IF NOT EXISTS is_user_modified BOOLEAN NOT NULL DEFAULT false;

UPDATE pic_pictograms
SET is_user_modified = true
WHERE is_system = false AND source_system_id IS NULL;
