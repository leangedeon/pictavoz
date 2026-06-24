import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { getSession } from "@/lib/auth";
import { optimizeAndUploadImage } from "@/lib/r2";
import { translatePictogramToEn } from "@/data/pictogram-translations-en";
import { ensurePersonalBoard } from "@/lib/user-board";
import { normalizePictogramRow } from "@/lib/pictograms-db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const categoryId = formData.get("category_id") as string | null;
    const locale = (formData.get("locale") as string | null) ?? "es";

    if (!file || !name || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const trimmed = name.trim();
    const name_es = trimmed;
    const name_en = locale.startsWith("en")
      ? trimmed
      : translatePictogramToEn(trimmed);

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageUrl = await optimizeAndUploadImage(buffer, file.name);

    const db = getDb();
    const { boardId } = await ensurePersonalBoard(db, session.userId);

    const { data, error } = await db
      .from(TABLES.pictograms)
      .insert({
        name: name_es,
        name_es,
        name_en,
        image_url: imageUrl,
        category_id: categoryId,
        user_id: session.userId,
        board_id: boardId,
        is_system: false,
        source_system_id: null,
        is_hidden: false,
        is_user_modified: true,
      })
      .select("*, category:pic_categories(*)")
      .single();

    if (error) {
      const message = error.message.includes("is_user_modified")
        ? "Falta la columna is_user_modified en la base de datos. Ejecuta supabase/migration-user-modified.sql en Supabase."
        : error.message;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json(
      normalizePictogramRow(data as Record<string, unknown>)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
