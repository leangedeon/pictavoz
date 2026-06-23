"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { PictogramCard } from "@/components/pictogram-card";
import { SentenceBuilder, useAddToSentence } from "@/components/sentence-builder";
import type { Category, Pictogram } from "@/types";
import { cn } from "@/lib/utils";
import { fetchCategories, fetchPictograms } from "@/lib/pictograms-client";

export function PictogramBrowser() {
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categories");

  const [categories, setCategories] = useState<Category[]>([]);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const addToSentence = useAddToSentence();

  const loadPictograms = useCallback(async (categoryId?: string | null, q?: string) => {
    setPictograms(await fetchPictograms(categoryId, q));
  }, []);

  useEffect(() => {
    async function init() {
      const cats = await fetchCategories<Category>();

      if (cats.length > 0) {
        setCategories(cats);
        setSelectedCategory(cats[0].id);
        await loadPictograms(cats[0].id);
      }

      setLoading(false);

      // Sync seed in background — don't block the UI
      fetch("/api/seed", { method: "POST" })
        .then((res) => res.json())
        .then((result) => {
          const needsReload =
            !result.skipped ||
            (result.duplicatesRemoved ?? 0) > 0 ||
            (result.orphansRemoved ?? 0) > 0 ||
            (result.pictogramsAdded ?? 0) > 0;
          if (!needsReload || !cats.length) return;
          fetchCategories<Category>().then((freshCats) => {
            if (freshCats.length > 0) {
              setCategories(freshCats);
              loadPictograms(freshCats[0].id);
            }
          });
        })
        .catch(() => undefined);
    }
    init();
  }, [loadPictograms]);

  useEffect(() => {
    if (selectedCategory) {
      loadPictograms(selectedCategory, search || undefined);
    }
  }, [selectedCategory, search, loadPictograms]);

  const categoryLabel = (slug: string) => {
    try {
      return tCat(slug as Parameters<typeof tCat>[0]);
    } catch {
      return slug;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SentenceBuilder />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.id);
              setSearch("");
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all",
              "border-2 active:scale-95 touch-manipulation",
              selectedCategory === cat.id
                ? "border-transparent text-white shadow-md"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
            )}
            style={
              selectedCategory === cat.id
                ? { backgroundColor: cat.color }
                : undefined
            }
          >
            <span>{cat.icon}</span>
            {categoryLabel(cat.slug)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {pictograms.map((pic) => (
          <PictogramCard
            key={pic.id}
            pictogram={pic}
            onClick={() => addToSentence(pic)}
          />
        ))}
      </div>

      {pictograms.length === 0 && (
        <p className="py-12 text-center text-slate-400">
          {tCommon("noResults")}
        </p>
      )}
    </div>
  );
}
