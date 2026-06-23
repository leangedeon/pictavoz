-- PictaVoz - Esquema de base de datos (sin Supabase Auth)
-- Ejecutar en el SQL Editor de Supabase

CREATE TYPE pic_user_role AS ENUM ('user', 'admin');

CREATE TABLE pic_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role pic_user_role NOT NULL DEFAULT 'user',
  locale TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pic_app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO pic_app_settings (key, value) VALUES ('max_boards_per_user', '5');

CREATE TABLE pic_user_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES pic_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mi tablero',
  is_active BOOLEAN NOT NULL DEFAULT true,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pic_pictograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  image_url TEXT,
  emoji TEXT,
  category_id UUID NOT NULL REFERENCES pic_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES pic_users(id) ON DELETE SET NULL,
  board_id UUID REFERENCES pic_user_boards(id) ON DELETE CASCADE,
  is_system BOOLEAN NOT NULL DEFAULT false,
  source_system_id UUID REFERENCES pic_pictograms(id) ON DELETE SET NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_pic_pictograms_system_unique_name
  ON pic_pictograms (category_id, lower(trim(name_es)))
  WHERE is_system = true;

CREATE UNIQUE INDEX idx_pic_pictograms_board_source_unique
  ON pic_pictograms (board_id, source_system_id)
  WHERE source_system_id IS NOT NULL AND board_id IS NOT NULL;

CREATE INDEX idx_pic_users_email ON pic_users(email);
CREATE INDEX idx_pic_user_boards_user ON pic_user_boards(user_id);
CREATE INDEX idx_pic_user_boards_share_token ON pic_user_boards(share_token)
  WHERE share_token IS NOT NULL;
CREATE INDEX idx_pic_pictograms_board ON pic_pictograms(board_id);
CREATE INDEX idx_pic_pictograms_category ON pic_pictograms(category_id);
CREATE INDEX idx_pic_pictograms_user ON pic_pictograms(user_id);
CREATE INDEX idx_pic_pictograms_source_system ON pic_pictograms(source_system_id);
CREATE INDEX idx_pic_categories_sort ON pic_categories(sort_order);

-- Sin RLS: la app maneja permisos en la capa de API con service role
-- Asignar admin manualmente:
-- UPDATE pic_users SET role = 'admin' WHERE email = 'tu@email.com';
