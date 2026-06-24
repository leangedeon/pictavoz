import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { getSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";
import { translatePictogramToEn } from "@/data/pictogram-translations-en";
import { normalizePictogramRow } from "@/lib/pictograms-db";
import { optimizeAndUploadImage } from "@/lib/r2";
import {
  ensurePersonalBoard,
  resolveUserPictogramId,
} from "@/lib/user-board";
import { deleteOrphanR2Images } from "@/lib/r2-cleanup";

async function getPictogramForUpdate(id: string) {
  const db = getDb();
  const { data, error } = await db
    .from(TABLES.pictograms)
    .select("id, user_id, is_system, image_url, source_system_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function canAdminManageSystem(
  pictogram: { is_system: boolean },
  session: { role: string }
): boolean {
  return pictogram.is_system && isAdminRole(session.role);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: routeId } = await params;
  const pictogram = await getPictogramForUpdate(routeId);

  if (!pictogram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let name_es: string | undefined;
  let name_en: string | undefined;
  let category_id: string | undefined;
  let emoji: string | null | undefined;
  let is_hidden: boolean | undefined;
  let clear_image = false;
  let imageFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawNameEs = formData.get("name_es");
    const rawNameEn = formData.get("name_en");
    const rawCategoryId = formData.get("category_id");
    const rawEmoji = formData.get("emoji");
    const rawClearImage = formData.get("clear_image");
    const rawHidden = formData.get("is_hidden");
    const file = formData.get("file");

    if (typeof rawNameEs === "string" && rawNameEs.trim()) {
      name_es = rawNameEs.trim();
    }
    if (typeof rawNameEn === "string") {
      name_en = rawNameEn.trim();
    }
    if (typeof rawCategoryId === "string" && rawCategoryId) {
      category_id = rawCategoryId;
    }
    if (typeof rawEmoji === "string") {
      emoji = rawEmoji.trim() || null;
    }
    if (rawHidden === "true") is_hidden = true;
    if (rawHidden === "false") is_hidden = false;
    clear_image = rawClearImage === "true";
    if (file instanceof File && file.size > 0) {
      imageFile = file;
    }
  } else {
    const body = await request.json();
    if (typeof body.name_es === "string" && body.name_es.trim()) {
      name_es = body.name_es.trim();
    }
    if (typeof body.name_en === "string") {
      name_en = body.name_en.trim();
    }
    if (typeof body.category_id === "string" && body.category_id) {
      category_id = body.category_id;
    }
    if (typeof body.emoji === "string") {
      emoji = body.emoji.trim() || null;
    }
    if (typeof body.is_hidden === "boolean") {
      is_hidden = body.is_hidden;
    }
    if (body.clear_image === true) {
      clear_image = true;
    }
  }

  const hasFieldChanges =
    !!name_es ||
    name_en !== undefined ||
    !!category_id ||
    emoji !== undefined ||
    is_hidden !== undefined ||
    clear_image ||
    !!imageFile;

  if (!hasFieldChanges) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const db = getDb();
  let targetId = routeId;

  if (canAdminManageSystem(pictogram, session)) {
    targetId = routeId;
  } else if (pictogram.user_id === session.userId && !pictogram.is_system) {
    targetId = routeId;
  } else if (pictogram.is_system && !isAdminRole(session.role)) {
    await ensurePersonalBoard(db, session.userId);
    const resolved = await resolveUserPictogramId(
      db,
      session.userId,
      routeId
    );
    if (!resolved) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    targetId = resolved;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};

  if (name_es) {
    updates.name_es = name_es;
    updates.name = name_es;
    if (name_en === undefined) {
      updates.name_en = translatePictogramToEn(name_es);
    }
  }

  if (name_en !== undefined) {
    updates.name_en = name_en || translatePictogramToEn(name_es ?? "");
  }

  if (category_id) {
    updates.category_id = category_id;
  }

  if (emoji !== undefined) {
    updates.emoji = emoji;
  }

  if (is_hidden !== undefined) {
    updates.is_hidden = is_hidden;
  }

  if (clear_image) {
    updates.image_url = null;
  }

  if (imageFile) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    updates.image_url = await optimizeAndUploadImage(buffer, imageFile.name);
  }

  if (!canAdminManageSystem(pictogram, session)) {
    updates.is_user_modified = true;
  }

  const { data: beforeUpdate } = await db
    .from(TABLES.pictograms)
    .select("image_url")
    .eq("id", targetId)
    .maybeSingle();

  const { data, error } = await db
    .from(TABLES.pictograms)
    .update(updates)
    .eq("id", targetId)
    .select("*, category:pic_categories(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (beforeUpdate?.image_url && beforeUpdate.image_url !== data.image_url) {
    await deleteOrphanR2Images(db, [beforeUpdate.image_url], [targetId]);
  }

  return NextResponse.json(
    normalizePictogramRow(data as Record<string, unknown>)
  );
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const pictogram = await getPictogramForUpdate(id);

  if (!pictogram) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = isAdminRole(session.role);

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

  const isOwner = pictogram.user_id === session.userId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getDb();
  const imageUrl = pictogram.image_url;

  const { error } = await db.from(TABLES.pictograms).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await deleteOrphanR2Images(db, [imageUrl], [id]);

  return NextResponse.json({ success: true });
}
