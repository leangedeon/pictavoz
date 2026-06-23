-- Múltiples tableros por usuario + configuración global
-- Ejecutar en Supabase SQL Editor (después de migration-user-boards.sql)

CREATE TABLE IF NOT EXISTS pic_app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pic_app_settings (key, value)
VALUES ('max_boards_per_user', '5')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE pic_user_boards DROP CONSTRAINT IF EXISTS pic_user_boards_user_id_key;

ALTER TABLE pic_user_boards ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Mi tablero';
ALTER TABLE pic_user_boards ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE pic_pictograms ADD COLUMN IF NOT EXISTS board_id UUID
  REFERENCES pic_user_boards(id) ON DELETE CASCADE;

UPDATE pic_pictograms p
SET board_id = b.id
FROM pic_user_boards b
WHERE p.user_id = b.user_id
  AND p.is_system = false
  AND p.board_id IS NULL;

DROP INDEX IF EXISTS idx_pic_pictograms_user_source_unique;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pic_pictograms_board_source_unique
  ON pic_pictograms (board_id, source_system_id)
  WHERE source_system_id IS NOT NULL AND board_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pic_pictograms_board ON pic_pictograms(board_id);
