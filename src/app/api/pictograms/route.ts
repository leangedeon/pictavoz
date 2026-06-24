import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { getSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";
import {
  dedupePictograms,
  filterPictogramsBySearch,
  normalizePictogramRow,
  sortPictogramsByLabel,
} from "@/lib/pictograms-db";
import { getActiveBoard } from "@/lib/user-board";
import { deleteOrphanR2Images } from "@/lib/r2-cleanup";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categoryId = request.nextUrl.searchParams.get("category_id");
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const systemOnly = request.nextUrl.searchParams.get("system_only") === "true";
  const includeHidden =
    request.nextUrl.searchParams.get("include_hidden") === "true";

  const db = getDb();
  let query = db
    .from(TABLES.pictograms)
    .select("*, category:pic_categories(*)");

  if (systemOnly) {
    if (!isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    query = query.eq("is_system", true);
  } else {
    const activeBoard = await getActiveBoard(db, session.userId);

    if (activeBoard) {
      query = query.eq("board_id", activeBoard.id).eq("is_system", false);
      if (!includeHidden) {
        query = query.eq("is_hidden", false);
      }
    } else {
      query = query.eq("is_system", true);
    }
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let pictograms = dedupePictograms(
    (data ?? []).map((row) =>
      normalizePictogramRow(row as Record<string, unknown>)
    )
  );

  pictograms = filterPictogramsBySearch(pictograms, search);
  pictograms = sortPictogramsByLabel(pictograms);

  return NextResponse.json(pictograms);
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const db = getDb();
  const { data: pictogram } = await db
    .from(TABLES.pictograms)
    .select("user_id, is_system, source_system_id, image_url")
    .eq("id", id)
    .single();

  if (!pictogram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = pictogram.user_id === session.userId;
  const isAdmin = isAdminRole(session.role);

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (pictogram.is_system && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    !isAdmin &&
    pictogram.source_system_id &&
    pictogram.user_id === session.userId
  ) {
    return NextResponse.json(
      { error: "Use hide instead of delete for default pictograms" },
      { status: 400 }
    );
  }

  const imageUrl = pictogram.image_url;

  const { error } = await db.from(TABLES.pictograms).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await deleteOrphanR2Images(db, [imageUrl], [id]);

  return NextResponse.json({ success: true });
}
