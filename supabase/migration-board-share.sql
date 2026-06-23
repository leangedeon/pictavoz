-- Compartir tableros por enlace
-- Ejecutar en Supabase SQL Editor (después de migration-multi-boards.sql)

ALTER TABLE pic_user_boards ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_pic_user_boards_share_token
  ON pic_user_boards(share_token)
  WHERE share_token IS NOT NULL;
