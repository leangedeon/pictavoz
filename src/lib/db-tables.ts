export const TABLES = {
  users: "pic_users",
  categories: "pic_categories",
  pictograms: "pic_pictograms",
  userBoards: "pic_user_boards",
  appSettings: "pic_app_settings",
} as const;

export const SETTINGS_KEYS = {
  maxBoardsPerUser: "max_boards_per_user",
} as const;

export const DEFAULT_MAX_BOARDS_PER_USER = 5;
