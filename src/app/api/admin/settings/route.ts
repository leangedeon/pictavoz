import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";
import { getAppSettings, setMaxBoardsPerUser } from "@/lib/app-settings";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const settings = await getAppSettings(db);

  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const maxBoardsPerUser = Number(body.maxBoardsPerUser);

  if (!Number.isFinite(maxBoardsPerUser)) {
    return NextResponse.json(
      { error: "maxBoardsPerUser must be a number" },
      { status: 400 }
    );
  }

  const db = getDb();

  try {
    const saved = await setMaxBoardsPerUser(db, maxBoardsPerUser);
    return NextResponse.json({ maxBoardsPerUser: saved });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save settings",
      },
      { status: 500 }
    );
  }
}
