export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface UserBoard {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Pictogram {
  id: string;
  name?: string | null;
  name_es: string;
  name_en: string;
  image_url: string | null;
  emoji: string | null;
  category_id: string;
  user_id: string | null;
  board_id?: string | null;
  is_system: boolean;
  source_system_id?: string | null;
  is_hidden?: boolean;
  created_at: string;
  category?: Category;
}

export interface PictogramWithCategory extends Pictogram {
  category: Category;
}
