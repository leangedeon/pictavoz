import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  copySharedBoard,
  getSharedBoardPreview,
} from "@/lib/board-share";
import { getBoardStatus } from "@/lib/user-board";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token?.trim()) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const db = getDb();

  try {
    const preview = await getSharedBoardPreview(db, token);
    if (!preview) {
      return NextResponse.json({ error: "shareNotFound" }, { status: 404 });
    }

    const session = await getSession();
    let importStatus: {
      isOwner: boolean;
      canImport: boolean;
      boardCount?: number;
      maxBoardsPerUser?: number;
    } | null = null;

    if (session) {
      const status = await getBoardStatus(db, session.userId);
      const isOwner = preview.ownerId === session.userId;
      importStatus = {
        isOwner,
        canImport: !isOwner && status.canCreateBoard,
        boardCount: status.boardCount,
        maxBoardsPerUser: status.maxBoardsPerUser,
      };
    }

    return NextResponse.json({ preview, importStatus });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load shared board",
      },
      { status: 500 }
    );
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await context.params;

  if (!token?.trim()) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const db = getDb();

  try {
    const result = await copySharedBoard(db, session.userId, token);
    const status = await getBoardStatus(db, session.userId);
    return NextResponse.json({ ...result, status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import board";
    const statusCode =
      message === "shareNotFound"
        ? 404
        : message === "cannotCopyOwnBoard" || message === "maxBoardsReached"
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
