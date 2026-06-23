import type { Pictogram, UserBoard } from "@/types";

export interface BoardStatus {
  hasPersonalBoard: boolean;
  boards: UserBoard[];
  activeBoardId: string | null;
  boardCount: number;
  maxBoardsPerUser: number;
  canCreateBoard: boolean;
  pictogramCount: number;
  hiddenCount: number;
  customCount: number;
  forked?: boolean;
}

export async function fetchPictograms(
  categoryId?: string | null,
  search?: string,
  options?: { systemOnly?: boolean; includeHidden?: boolean }
): Promise<Pictogram[]> {
  const params = new URLSearchParams();
  if (categoryId) params.set("category_id", categoryId);
  if (search) params.set("search", search);
  if (options?.systemOnly) params.set("system_only", "true");
  if (options?.includeHidden) params.set("include_hidden", "true");

  const res = await fetch(`/api/pictograms?${params}`);
  const data: unknown = await res.json();

  if (!res.ok || !Array.isArray(data)) {
    console.error("Failed to load pictograms:", data);
    return [];
  }

  return data as Pictogram[];
}

export async function fetchCategories<T>(): Promise<T[]> {
  const res = await fetch("/api/categories");
  const data: unknown = await res.json();

  if (!res.ok || !Array.isArray(data)) {
    console.error("Failed to load categories:", data);
    return [];
  }

  return data as T[];
}

export async function fetchBoardStatus(): Promise<BoardStatus | null> {
  const res = await fetch("/api/board");
  if (!res.ok) return null;
  return res.json();
}

export async function resetPersonalBoard(
  boardId?: string
): Promise<BoardStatus | null> {
  const url = boardId
    ? `/api/board?board_id=${encodeURIComponent(boardId)}`
    : "/api/board";
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) return null;
  return res.json();
}

export async function activateBoard(
  boardId: string
): Promise<BoardStatus | null> {
  const res = await fetch("/api/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "activate", boardId }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createBoard(name?: string): Promise<BoardStatus | null> {
  const res = await fetch("/api/board", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "create", name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create board");
  return data;
}

export async function createBoardShareLink(boardId: string): Promise<string> {
  const res = await fetch("/api/board/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boardId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create share link");
  return data.token as string;
}

export async function updatePictogram(
  id: string,
  payload: FormData | Record<string, unknown>
): Promise<Pictogram> {
  const isFormData = payload instanceof FormData;
  const res = await fetch(`/api/pictograms/${id}`, {
    method: "PATCH",
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: isFormData ? payload : JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Update failed");
  return data as Pictogram;
}

export async function deletePictogram(id: string): Promise<void> {
  const res = await fetch(`/api/pictograms/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Delete failed");
}
