import { translatePictogramToEn } from "@/data/pictogram-translations-en";
import { normalizeR2PublicUrl } from "@/lib/r2-url";
import type { Pictogram } from "@/types";

type PictogramRow = Record<string, unknown> & Partial<Pictogram>;

export function normalizePictogramNameKey(
  name: string | null | undefined
): string {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function dedupePictograms(pictograms: Pictogram[]): Pictogram[] {
  const seenIds = new Set<string>();
  const seenCategoryNames = new Set<string>();
  const result: Pictogram[] = [];

  for (const pictogram of pictograms) {
    if (seenIds.has(pictogram.id)) continue;

    const nameKey = normalizePictogramNameKey(
      pictogram.name_es ?? pictogram.name
    );
    if (!nameKey) {
      result.push(pictogram);
      seenIds.add(pictogram.id);
      continue;
    }

    const categoryKey = `${pictogram.category_id}:${nameKey}`;
    if (seenCategoryNames.has(categoryKey)) continue;

    seenIds.add(pictogram.id);
    seenCategoryNames.add(categoryKey);
    result.push(pictogram);
  }

  return result;
}

export function normalizePictogramRow(row: PictogramRow): Pictogram {
  const legacyName = typeof row.name === "string" ? row.name : "";
  const name_es =
    typeof row.name_es === "string" && row.name_es
      ? row.name_es
      : legacyName;
  const name_en =
    typeof row.name_en === "string" && row.name_en
      ? row.name_en
      : translatePictogramToEn(name_es);

  return {
    ...(row as Pictogram),
    name_es,
    name_en,
    image_url: normalizeR2PublicUrl(
      typeof row.image_url === "string" ? row.image_url : null
    ),
  };
}

export function filterPictogramsBySearch(
  pictograms: Pictogram[],
  search: string
): Pictogram[] {
  const q = search.trim().toLowerCase();
  if (!q) return pictograms;

  return pictograms.filter(
    (p) =>
      p.name_es.toLowerCase().includes(q) ||
      p.name_en.toLowerCase().includes(q) ||
      (p.name?.toLowerCase().includes(q) ?? false)
  );
}

export function filterPictogramsByOwnership(
  pictograms: Pictogram[],
  ownership: "all" | "mine"
): Pictogram[] {
  if (ownership !== "mine") return pictograms;

  return pictograms.filter(
    (p) => !p.source_system_id || p.is_user_modified === true
  );
}

export function isUserOwnedPictogram(pictogram: Pictogram): boolean {
  return !pictogram.source_system_id || pictogram.is_user_modified === true;
}

export function sortPictogramsByLabel(pictograms: Pictogram[]): Pictogram[] {
  return [...pictograms].sort((a, b) =>
    a.name_es.localeCompare(b.name_es, "es")
  );
}
