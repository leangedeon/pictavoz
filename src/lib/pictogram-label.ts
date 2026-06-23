import { translatePictogramToEn } from "@/data/pictogram-translations-en";
import type { Pictogram } from "@/types";
import type { Locale } from "@/i18n/routing";

type PictogramLike = Pick<Pictogram, "name_es" | "name_en" | "name">;

export function getPictogramLabel(
  pictogram: PictogramLike,
  locale: string
): string {
  const es = pictogram.name_es ?? pictogram.name ?? "";
  const en =
    pictogram.name_en && pictogram.name_en !== es
      ? pictogram.name_en
      : translatePictogramToEn(es);

  return locale.startsWith("en") ? en : es;
}

export function getPictogramLabels(pictogram: PictogramLike): {
  name_es: string;
  name_en: string;
} {
  const name_es = pictogram.name_es ?? pictogram.name ?? "";
  const name_en =
    pictogram.name_en && pictogram.name_en !== name_es
      ? pictogram.name_en
      : translatePictogramToEn(name_es);
  return { name_es, name_en };
}

export function isEnglishLocale(locale: string): boolean {
  return locale.startsWith("en");
}

export type { Locale };
