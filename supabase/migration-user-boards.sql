-- Tableros personales por usuario (copy-on-first-write)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pic_user_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES pic_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pic_pictograms ADD COLUMN IF NOT EXISTS source_system_id UUID
  REFERENCES pic_pictograms(id) ON DELETE SET NULL;

ALTER TABLE pic_pictograms ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_pic_user_boards_user ON pic_user_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_pic_pictograms_source_system ON pic_pictograms(source_system_id);
CREATE INDEX IF NOT EXISTS idx_pic_pictograms_user_board ON pic_pictograms(user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pic_pictograms_user_source_unique
  ON pic_pictograms (user_id, source_system_id)
  WHERE source_system_id IS NOT NULL;
