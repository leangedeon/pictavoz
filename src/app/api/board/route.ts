import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  createUserBoard,
  ensurePersonalBoard,
  getBoardStatus,
  resetBoard,
  resetPersonalBoard,
  setActiveBoard,
  setDefaultBoard,
} from "@/lib/user-board";
import { DEFAULT_BOARD_ID } from "@/lib/board-constants";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const status = await getBoardStatus(db, session.userId);

  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";

  const db = getDb();

  try {
    if (action === "fork") {
      const result = await ensurePersonalBoard(db, session.userId);
      const status = await getBoardStatus(db, session.userId);
      return NextResponse.json({ ...status, forked: result.forked });
    }

    if (action === "create") {
      const name = typeof body.name === "string" ? body.name : undefined;
      await createUserBoard(db, session.userId, name);
      const status = await getBoardStatus(db, session.userId);
      return NextResponse.json(status);
    }

    if (action === "activate") {
      const boardId = typeof body.boardId === "string" ? body.boardId : "";
      if (!boardId) {
        return NextResponse.json({ error: "boardId required" }, { status: 400 });
      }

      if (boardId === DEFAULT_BOARD_ID) {
        await setDefaultBoard(db, session.userId);
      } else {
        await setActiveBoard(db, session.userId, boardId);
      }

      const status = await getBoardStatus(db, session.userId);
      return NextResponse.json(status);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Board action failed";
    const status = message === "maxBoardsReached" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const boardId = url.searchParams.get("board_id");

  const db = getDb();

  try {
    if (boardId) {
      await resetBoard(db, session.userId, boardId);
    } else {
      await resetPersonalBoard(db, session.userId);
    }
    const status = await getBoardStatus(db, session.userId);
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to reset board",
      },
      { status: 500 }
    );
  }
}
