import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { getMaxBoardsPerUser } from "@/lib/app-settings";

type Db = ReturnType<typeof getDb>;

const INSERT_CHUNK = 50;

export interface UserBoardRow {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

async function forkSystemCatalogToBoard(
  db: Db,
  userId: string,
  boardId: string
): Promise<void> {
  const { data: systemPictograms, error: loadError } = await db
    .from(TABLES.pictograms)
    .select("id, name_es, name_en, emoji, image_url, category_id")
    .eq("is_system", true);

  if (loadError) {
    throw new Error(loadError.message);
  }

  const rows = (systemPictograms ?? []).map((pic) => ({
    name: pic.name_es,
    name_es: pic.name_es,
    name_en: pic.name_en,
    emoji: pic.emoji,
    image_url: pic.image_url,
    category_id: pic.category_id,
    user_id: userId,
    board_id: boardId,
    is_system: false,
    source_system_id: pic.id,
    is_hidden: false,
  }));

  for (let i = 0; i < rows.length; i += INSERT_CHUNK) {
    const chunk = rows.slice(i, i + INSERT_CHUNK);
    const { error: insertError } = await db
      .from(TABLES.pictograms)
      .insert(chunk);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

export async function getUserBoards(
  db: Db,
  userId: string
): Promise<UserBoardRow[]> {
  const { data, error } = await db
    .from(TABLES.userBoards)
    .select("id, user_id, name, is_active, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getActiveBoard(
  db: Db,
  userId: string
): Promise<UserBoardRow | null> {
  const { data } = await db
    .from(TABLES.userBoards)
    .select("id, user_id, name, is_active, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (data) return data;

  const boards = await getUserBoards(db, userId);
  return boards[0] ?? null;
}

export async function hasPersonalBoard(
  db: Db,
  userId: string
): Promise<boolean> {
  const { count } = await db
    .from(TABLES.userBoards)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return (count ?? 0) > 0;
}

async function deactivateUserBoards(db: Db, userId: string): Promise<void> {
  await db
    .from(TABLES.userBoards)
    .update({ is_active: false })
    .eq("user_id", userId);
}

export async function setActiveBoard(
  db: Db,
  userId: string,
  boardId: string
): Promise<UserBoardRow> {
  const { data: board } = await db
    .from(TABLES.userBoards)
    .select("id, user_id, name, is_active, created_at")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!board) {
    throw new Error("Board not found");
  }

  await deactivateUserBoards(db, userId);

  const { data: updated, error } = await db
    .from(TABLES.userBoards)
    .update({ is_active: true })
    .eq("id", boardId)
    .select("id, user_id, name, is_active, created_at")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to activate board");
  }

  return updated;
}

export async function createUserBoard(
  db: Db,
  userId: string,
  name?: string
): Promise<{ board: UserBoardRow; forked: boolean }> {
  const [boards, maxBoards] = await Promise.all([
    getUserBoards(db, userId),
    getMaxBoardsPerUser(db),
  ]);

  if (boards.length >= maxBoards) {
    throw new Error("maxBoardsReached");
  }

  const boardName =
    name?.trim() ||
    (boards.length === 0 ? "Mi tablero" : `Tablero ${boards.length + 1}`);

  await deactivateUserBoards(db, userId);

  const { data: board, error: boardError } = await db
    .from(TABLES.userBoards)
    .insert({
      user_id: userId,
      name: boardName,
      is_active: true,
    })
    .select("id, user_id, name, is_active, created_at")
    .single();

  if (boardError || !board) {
    throw new Error(boardError?.message ?? "Failed to create board");
  }

  await forkSystemCatalogToBoard(db, userId, board.id);

  return { board, forked: true };
}

export async function ensurePersonalBoard(
  db: Db,
  userId: string
): Promise<{ forked: boolean; boardId: string }> {
  const active = await getActiveBoard(db, userId);
  if (active) {
    const { count } = await db
      .from(TABLES.pictograms)
      .select("*", { count: "exact", head: true })
      .eq("board_id", active.id);

    if ((count ?? 0) > 0) {
      return { forked: false, boardId: active.id };
    }

    await forkSystemCatalogToBoard(db, userId, active.id);
    return { forked: true, boardId: active.id };
  }

  const { board, forked } = await createUserBoard(db, userId);
  return { forked, boardId: board.id };
}

export async function resolveUserPictogramId(
  db: Db,
  userId: string,
  pictogramId: string
): Promise<string | null> {
  const activeBoard = await getActiveBoard(db, userId);
  if (!activeBoard) return null;

  const { data: direct } = await db
    .from(TABLES.pictograms)
    .select("id, user_id, board_id, is_system, source_system_id")
    .eq("id", pictogramId)
    .maybeSingle();

  if (!direct) return null;

  if (
    direct.user_id === userId &&
    direct.board_id === activeBoard.id &&
    !direct.is_system
  ) {
    return direct.id;
  }

  if (direct.is_system) {
    const { data: copy } = await db
      .from(TABLES.pictograms)
      .select("id")
      .eq("board_id", activeBoard.id)
      .eq("source_system_id", direct.id)
      .maybeSingle();

    return copy?.id ?? null;
  }

  return null;
}

export async function resetBoard(
  db: Db,
  userId: string,
  boardId: string
): Promise<void> {
  const { data: board } = await db
    .from(TABLES.userBoards)
    .select("id, is_active")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!board) {
    throw new Error("Board not found");
  }

  const { error: deletePicsError } = await db
    .from(TABLES.pictograms)
    .delete()
    .eq("board_id", boardId);

  if (deletePicsError) {
    throw new Error(deletePicsError.message);
  }

  const { error: deleteBoardError } = await db
    .from(TABLES.userBoards)
    .delete()
    .eq("id", boardId);

  if (deleteBoardError) {
    throw new Error(deleteBoardError.message);
  }

  if (board.is_active) {
    const remaining = await getUserBoards(db, userId);
    if (remaining.length > 0) {
      await setActiveBoard(db, userId, remaining[0].id);
    }
  }
}

export async function resetPersonalBoard(
  db: Db,
  userId: string
): Promise<void> {
  const active = await getActiveBoard(db, userId);
  if (!active) return;
  await resetBoard(db, userId, active.id);
}

export async function getBoardStatus(db: Db, userId: string) {
  const [boards, maxBoardsPerUser, activeBoard] = await Promise.all([
    getUserBoards(db, userId),
    getMaxBoardsPerUser(db),
    getActiveBoard(db, userId),
  ]);

  if (!activeBoard) {
    const { count } = await db
      .from(TABLES.pictograms)
      .select("*", { count: "exact", head: true })
      .eq("is_system", true);

    return {
      hasPersonalBoard: false,
      boards: [] as UserBoardRow[],
      activeBoardId: null as string | null,
      boardCount: 0,
      maxBoardsPerUser,
      canCreateBoard: true,
      pictogramCount: count ?? 0,
      hiddenCount: 0,
      customCount: 0,
    };
  }

  const [{ count: visibleCount }, { count: hiddenCount }, { count: customCount }] =
    await Promise.all([
      db
        .from(TABLES.pictograms)
        .select("*", { count: "exact", head: true })
        .eq("board_id", activeBoard.id)
        .eq("is_hidden", false),
      db
        .from(TABLES.pictograms)
        .select("*", { count: "exact", head: true })
        .eq("board_id", activeBoard.id)
        .eq("is_hidden", true),
      db
        .from(TABLES.pictograms)
        .select("*", { count: "exact", head: true })
        .eq("board_id", activeBoard.id)
        .is("source_system_id", null),
    ]);

  return {
    hasPersonalBoard: boards.length > 0,
    boards,
    activeBoardId: activeBoard.id,
    boardCount: boards.length,
    maxBoardsPerUser,
    canCreateBoard: boards.length < maxBoardsPerUser,
    pictogramCount: visibleCount ?? 0,
    hiddenCount: hiddenCount ?? 0,
    customCount: customCount ?? 0,
  };
}
