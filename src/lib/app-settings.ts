import { getDb } from "@/lib/db";
import {
  DEFAULT_MAX_BOARDS_PER_USER,
  SETTINGS_KEYS,
  TABLES,
} from "@/lib/db-tables";

type Db = ReturnType<typeof getDb>;

function parseMaxBoards(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_MAX_BOARDS_PER_USER;
  }
  return Math.min(parsed, 50);
}

export async function getMaxBoardsPerUser(db: Db): Promise<number> {
  const { data } = await db
    .from(TABLES.appSettings)
    .select("value")
    .eq("key", SETTINGS_KEYS.maxBoardsPerUser)
    .maybeSingle();

  return parseMaxBoards(data?.value);
}

export async function setMaxBoardsPerUser(
  db: Db,
  maxBoards: number
): Promise<number> {
  const value = String(Math.max(1, Math.min(50, Math.floor(maxBoards))));

  const { error } = await db.from(TABLES.appSettings).upsert(
    {
      key: SETTINGS_KEYS.maxBoardsPerUser,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(error.message);
  }

  return Number.parseInt(value, 10);
}

export async function getAppSettings(db: Db) {
  const maxBoardsPerUser = await getMaxBoardsPerUser(db);
  return { maxBoardsPerUser };
}
