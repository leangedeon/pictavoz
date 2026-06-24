import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { deleteR2ObjectByUrl } from "@/lib/r2";
import { isManagedR2ImageUrl, normalizeR2PublicUrl } from "@/lib/r2-url";

type Db = ReturnType<typeof getDb>;

function urlVariants(url: string): string[] {
  const normalized = normalizeR2PublicUrl(url);
  return normalized && normalized !== url ? [url, normalized] : [url];
}

async function hasRemainingReferences(
  db: Db,
  url: string,
  excludeIds: string[] = []
): Promise<boolean> {
  const excludeSet = new Set(excludeIds);

  for (const variant of urlVariants(url)) {
    const { data } = await db
      .from(TABLES.pictograms)
      .select("id")
      .eq("image_url", variant);

    if (
      (data ?? []).some((row) => !excludeSet.has(row.id))
    ) {
      return true;
    }
  }

  return false;
}

export async function deleteOrphanR2Images(
  db: Db,
  urls: Array<string | null | undefined>,
  excludePictogramIds: string[] = []
): Promise<void> {
  const uniqueUrls = [
    ...new Set(urls.filter((url): url is string => Boolean(url))),
  ];

  for (const url of uniqueUrls) {
    if (!isManagedR2ImageUrl(url)) continue;
    if (await hasRemainingReferences(db, url, excludePictogramIds)) continue;
    await deleteR2ObjectByUrl(url);
  }
}

export async function deleteBoardR2Images(
  db: Db,
  boardId: string
): Promise<void> {
  const { data: pictograms, error } = await db
    .from(TABLES.pictograms)
    .select("id, image_url")
    .eq("board_id", boardId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = pictograms ?? [];
  await deleteOrphanR2Images(
    db,
    rows.map((row) => row.image_url),
    rows.map((row) => row.id)
  );
}
