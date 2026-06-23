import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { getMaxBoardsPerUser } from "@/lib/app-settings";
import { getUserBoards, type UserBoardRow } from "@/lib/user-board";

type Db = ReturnType<typeof getDb>;

const INSERT_CHUNK = 50;

export interface SharedBoardPreview {
  boardId: string;
  boardName: string;
  ownerId: string;
  ownerName: string;
  pictogramCount: number;
  visibleCount: number;
  hiddenCount: number;
  customCount: number;
}

async function deactivateUserBoards(db: Db, userId: string): Promise<void> {
  await db
    .from(TABLES.userBoards)
    .update({ is_active: false })
    .eq("user_id", userId);
}

async function getBoardForOwner(
  db: Db,
  userId: string,
  boardId: string
): Promise<UserBoardRow | null> {
  const { data, error } = await db
    .from(TABLES.userBoards)
    .select("id, user_id, name, is_active, created_at")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function ensureBoardShareToken(
  db: Db,
  userId: string,
  boardId: string
): Promise<string> {
  const board = await getBoardForOwner(db, userId, boardId);
  if (!board) {
    throw new Error("boardNotFound");
  }

  const { data: existing } = await db
    .from(TABLES.userBoards)
    .select("share_token")
    .eq("id", boardId)
    .single();

  if (existing?.share_token) {
    return existing.share_token;
  }

  const token = randomBytes(16).toString("hex");

  const { error } = await db
    .from(TABLES.userBoards)
    .update({ share_token: token })
    .eq("id", boardId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return token;
}

export async function getSharedBoardPreview(
  db: Db,
  shareToken: string
): Promise<SharedBoardPreview | null> {
  const { data: board, error } = await db
    .from(TABLES.userBoards)
    .select("id, user_id, name, share_token")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!board?.share_token) {
    return null;
  }

  const { data: owner } = await db
    .from(TABLES.users)
    .select("full_name, email")
    .eq("id", board.user_id)
    .maybeSingle();

  const ownerName =
    owner?.full_name?.trim() || owner?.email?.split("@")[0] || "Usuario";

  const [
    { count: pictogramCount },
    { count: visibleCount },
    { count: hiddenCount },
    { count: customCount },
  ] = await Promise.all([
    db
      .from(TABLES.pictograms)
      .select("*", { count: "exact", head: true })
      .eq("board_id", board.id),
    db
      .from(TABLES.pictograms)
      .select("*", { count: "exact", head: true })
      .eq("board_id", board.id)
      .eq("is_hidden", false),
    db
      .from(TABLES.pictograms)
      .select("*", { count: "exact", head: true })
      .eq("board_id", board.id)
      .eq("is_hidden", true),
    db
      .from(TABLES.pictograms)
      .select("*", { count: "exact", head: true })
      .eq("board_id", board.id)
      .is("source_system_id", null),
  ]);

  return {
    boardId: board.id,
    boardName: board.name,
    ownerId: board.user_id,
    ownerName,
    pictogramCount: pictogramCount ?? 0,
    visibleCount: visibleCount ?? 0,
    hiddenCount: hiddenCount ?? 0,
    customCount: customCount ?? 0,
  };
}

export async function copySharedBoard(
  db: Db,
  recipientUserId: string,
  shareToken: string
): Promise<{ boardId: string; boardName: string }> {
  const preview = await getSharedBoardPreview(db, shareToken);
  if (!preview) {
    throw new Error("shareNotFound");
  }

  if (preview.ownerId === recipientUserId) {
    throw new Error("cannotCopyOwnBoard");
  }

  const [boards, maxBoards] = await Promise.all([
    getUserBoards(db, recipientUserId),
    getMaxBoardsPerUser(db),
  ]);

  if (boards.length >= maxBoards) {
    throw new Error("maxBoardsReached");
  }

  const boardName = `${preview.boardName} (${preview.ownerName})`.slice(0, 120);

  await deactivateUserBoards(db, recipientUserId);

  const { data: newBoard, error: boardError } = await db
    .from(TABLES.userBoards)
    .insert({
      user_id: recipientUserId,
      name: boardName,
      is_active: true,
    })
    .select("id, user_id, name, is_active, created_at")
    .single();

  if (boardError || !newBoard) {
    throw new Error(boardError?.message ?? "Failed to create board");
  }

  const { data: sourcePictograms, error: loadError } = await db
    .from(TABLES.pictograms)
    .select(
      "name_es, name_en, emoji, image_url, category_id, is_hidden, source_system_id"
    )
    .eq("board_id", preview.boardId);

  if (loadError) {
    throw new Error(loadError.message);
  }

  const rows = (sourcePictograms ?? []).map((pic) => ({
    name: pic.name_es,
    name_es: pic.name_es,
    name_en: pic.name_en,
    emoji: pic.emoji,
    image_url: pic.image_url,
    category_id: pic.category_id,
    user_id: recipientUserId,
    board_id: newBoard.id,
    is_system: false,
    source_system_id: pic.source_system_id,
    is_hidden: pic.is_hidden ?? false,
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

  return { boardId: newBoard.id, boardName: newBoard.name };
}
