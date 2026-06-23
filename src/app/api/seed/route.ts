import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import {
  DEFAULT_CATEGORIES,
  SEED_EXPECTED,
} from "@/data/default-pictograms";
import { normalizePictogramNameKey } from "@/lib/pictograms-db";

async function isSeedComplete(db: ReturnType<typeof getDb>): Promise<boolean> {
  const [{ count: categoryCount }, { count: pictogramCount }, { data: categories }] =
    await Promise.all([
      db
        .from(TABLES.categories)
        .select("*", { count: "exact", head: true }),
      db
        .from(TABLES.pictograms)
        .select("*", { count: "exact", head: true })
        .eq("is_system", true),
      db.from(TABLES.categories).select("slug"),
    ]);

  if ((categoryCount ?? 0) < SEED_EXPECTED.categories) return false;
  if ((pictogramCount ?? 0) < SEED_EXPECTED.pictograms) return false;

  const slugSet = new Set((categories ?? []).map((c) => c.slug));
  return DEFAULT_CATEGORIES.every((c) => slugSet.has(c.slug));
}

async function loadExistingPictograms(
  db: ReturnType<typeof getDb>,
  categoryId: string
): Promise<
  Array<{ id: string; name?: string; name_es?: string; name_en?: string }>
> {
  const full = await db
    .from(TABLES.pictograms)
    .select("id, name_es, name_en, name")
    .eq("category_id", categoryId)
    .eq("is_system", true);

  if (!full.error) return full.data ?? [];

  const legacy = await db
    .from(TABLES.pictograms)
    .select("id, name")
    .eq("category_id", categoryId)
    .eq("is_system", true);

  return legacy.data ?? [];
}

function pictogramNameKey(p: { name?: string; name_es?: string }): string {
  return normalizePictogramNameKey(p.name_es ?? p.name);
}

function buildPictogramInsertRow(row: {
  name_es: string;
  name_en: string;
  emoji: string;
  category_id: string;
}) {
  return {
    name: row.name_es,
    name_es: row.name_es,
    name_en: row.name_en,
    emoji: row.emoji,
    category_id: row.category_id,
    is_system: true,
    user_id: null,
    source_system_id: null,
    is_hidden: false,
  };
}

async function removeDuplicateSystemPictograms(
  db: ReturnType<typeof getDb>,
  categoryId: string
): Promise<number> {
  const existing = await loadExistingPictograms(db, categoryId);
  const groups = new Map<string, typeof existing>();

  for (const pictogram of existing) {
    const key = pictogramNameKey(pictogram);
    if (!key) continue;
    const group = groups.get(key) ?? [];
    group.push(pictogram);
    groups.set(key, group);
  }

  const toDelete: string[] = [];
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    toDelete.push(...sorted.slice(1).map((p) => p.id));
  }

  if (toDelete.length === 0) return 0;

  const { error } = await db.from(TABLES.pictograms).delete().in("id", toDelete);
  if (error) throw new Error(error.message);

  return toDelete.length;
}

async function removeOrphanSystemPictograms(
  db: ReturnType<typeof getDb>,
  categoryId: string,
  seedNames: Set<string>
): Promise<number> {
  const existing = await loadExistingPictograms(db, categoryId);
  const toDelete = existing
    .filter((p) => !seedNames.has(pictogramNameKey(p)))
    .map((p) => p.id);

  if (toDelete.length === 0) return 0;

  const { error } = await db.from(TABLES.pictograms).delete().in("id", toDelete);
  if (error) throw new Error(error.message);

  return toDelete.length;
}

async function syncSeedCleanup(
  db: ReturnType<typeof getDb>
): Promise<{ duplicatesRemoved: number; orphansRemoved: number }> {
  let duplicatesRemoved = 0;
  let orphansRemoved = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    const { data: existingCat } = await db
      .from(TABLES.categories)
      .select("id")
      .eq("slug", cat.slug)
      .maybeSingle();

    if (!existingCat) continue;

    const seedNames = new Set(
      cat.pictograms.map((p) => normalizePictogramNameKey(p.name_es))
    );

    duplicatesRemoved += await removeDuplicateSystemPictograms(
      db,
      existingCat.id
    );
    orphansRemoved += await removeOrphanSystemPictograms(
      db,
      existingCat.id,
      seedNames
    );
  }

  return { duplicatesRemoved, orphansRemoved };
}

async function batchUpdatePictograms(
  db: ReturnType<typeof getDb>,
  updates: Array<{ id: string; name_es: string; name_en: string }>
) {
  const chunkSize = 25;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(({ id, name_es, name_en }) =>
        db
          .from(TABLES.pictograms)
          .update({ name: name_es, name_es, name_en })
          .eq("id", id)
      )
    );
  }
}

async function batchInsertPictograms(
  db: ReturnType<typeof getDb>,
  rows: Array<{
    name_es: string;
    name_en: string;
    emoji: string;
    category_id: string;
  }>
) {
  if (rows.length === 0) return null;

  const { error } = await db
    .from(TABLES.pictograms)
    .insert(rows.map(buildPictogramInsertRow));

  return error?.message ?? null;
}

export async function POST() {
  const db = getDb();

  let cleanup = { duplicatesRemoved: 0, orphansRemoved: 0 };
  try {
    cleanup = await syncSeedCleanup(db);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Seed cleanup failed",
      },
      { status: 500 }
    );
  }

  if (await isSeedComplete(db)) {
    return NextResponse.json({
      message: "Seed already up to date",
      skipped: true,
      ...cleanup,
      categories: SEED_EXPECTED.categories,
      pictograms: SEED_EXPECTED.pictograms,
    });
  }

  let categoriesAdded = 0;
  let pictogramsAdded = 0;
  let pictogramsUpdated = 0;

  for (const cat of DEFAULT_CATEGORIES) {
    let categoryId: string;

    const { data: existingCat } = await db
      .from(TABLES.categories)
      .select("id")
      .eq("slug", cat.slug)
      .maybeSingle();

    if (existingCat) {
      categoryId = existingCat.id;
      await db
        .from(TABLES.categories)
        .update({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          sort_order: cat.sort_order,
        })
        .eq("id", categoryId);
    } else {
      const { data: newCat, error: catError } = await db
        .from(TABLES.categories)
        .insert({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color: cat.color,
          sort_order: cat.sort_order,
        })
        .select("id")
        .single();

      if (catError || !newCat) {
        return NextResponse.json(
          { error: catError?.message ?? "Failed to create category" },
          { status: 500 }
        );
      }

      categoryId = newCat.id;
      categoriesAdded++;
    }

    const existingPics = await loadExistingPictograms(db, categoryId);
    const byNameEs = new Map(
      existingPics.map((p) => [pictogramNameKey(p), p])
    );

    const toInsert: Array<{
      name_es: string;
      name_en: string;
      emoji: string;
      category_id: string;
    }> = [];

    const toUpdate: Array<{ id: string; name_es: string; name_en: string }> =
      [];

    for (const p of cat.pictograms) {
      const key = normalizePictogramNameKey(p.name_es);
      const existing = byNameEs.get(key);

      if (existing) {
        const currentEn = existing.name_en ?? existing.name ?? "";
        const currentEs = existing.name_es ?? existing.name ?? "";
        if (currentEn !== p.name_en || currentEs !== p.name_es) {
          toUpdate.push({
            id: existing.id,
            name_es: p.name_es,
            name_en: p.name_en,
          });
        }
        continue;
      }

      toInsert.push({
        name_es: p.name_es,
        name_en: p.name_en,
        emoji: p.emoji,
        category_id: categoryId,
      });
    }

    if (toUpdate.length > 0) {
      await batchUpdatePictograms(db, toUpdate);
      pictogramsUpdated += toUpdate.length;
    }

    if (toInsert.length > 0) {
      const insertError = await batchInsertPictograms(db, toInsert);
      if (insertError) {
        return NextResponse.json({ error: insertError }, { status: 500 });
      }
      pictogramsAdded += toInsert.length;
    }
  }

  return NextResponse.json({
    message: "Seed sync complete",
    skipped: false,
    ...cleanup,
    categoriesAdded,
    pictogramsAdded,
    pictogramsUpdated,
    totalCategories: SEED_EXPECTED.categories,
    totalPictograms: SEED_EXPECTED.pictograms,
  });
}
