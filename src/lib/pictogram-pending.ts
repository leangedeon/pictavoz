import type { Pictogram } from "@/types";
import { sortPictogramsByLabel } from "@/lib/pictograms-db";

const PICTOGRAM_KEY = "pictavoz:pending-pictogram";
const CATEGORY_KEY = "pictavoz:pending-category";

export function stashCreatedPictogram(
  pictogram: Pictogram,
  categoryId: string
): void {
  sessionStorage.setItem(PICTOGRAM_KEY, JSON.stringify(pictogram));
  sessionStorage.setItem(CATEGORY_KEY, categoryId);
}

export function consumePendingCategoryFilter(): string | null {
  const categoryId = sessionStorage.getItem(CATEGORY_KEY);
  sessionStorage.removeItem(CATEGORY_KEY);
  return categoryId;
}

export function mergePendingPictogram(pictograms: Pictogram[]): Pictogram[] {
  const raw = sessionStorage.getItem(PICTOGRAM_KEY);
  if (!raw) return pictograms;

  sessionStorage.removeItem(PICTOGRAM_KEY);

  try {
    const pending = JSON.parse(raw) as Pictogram;
    if (pictograms.some((p) => p.id === pending.id)) {
      return pictograms;
    }
    return sortPictogramsByLabel([...pictograms, pending]);
  } catch {
    return pictograms;
  }
}
