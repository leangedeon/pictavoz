import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureBoardShareToken } from "@/lib/board-share";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const boardId = typeof body.boardId === "string" ? body.boardId : "";

  if (!boardId) {
    return NextResponse.json({ error: "boardId required" }, { status: 400 });
  }

  const db = getDb();

  try {
    const token = await ensureBoardShareToken(db, session.userId, boardId);
    return NextResponse.json({ token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create share link";
    const status = message === "boardNotFound" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
