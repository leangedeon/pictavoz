"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Play, RotateCcw, X } from "lucide-react";
import { PictogramCard } from "@/components/pictogram-card";
import { useSentenceStore } from "@/store/sentence-store";
import { speak, speakSequence, stopSpeaking, preloadVoices } from "@/lib/tts";
import { getPictogramLabel } from "@/lib/pictogram-label";
import { cn } from "@/lib/utils";

export function SentenceBuilder() {
  const t = useTranslations("communicate");
  const locale = useLocale();
  const { items, removeItem, reset } = useSentenceStore();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    preloadVoices();
  }, []);

  const handlePlay = async () => {
    if (items.length === 0 || isPlaying) return;
    setIsPlaying(true);
    try {
      await speakSequence(
        items.map((i) => getPictogramLabel(i, locale)),
        locale
      );
    } finally {
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    stopSpeaking();
    reset();
  };

  return (
    <section className="rounded-3xl border-2 border-indigo-100 bg-white/90 p-4 shadow-lg backdrop-blur sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
          {t("mySentence")}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePlay}
            disabled={items.length === 0 || isPlaying}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-all",
              "bg-emerald-500 hover:bg-emerald-600 active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <Play className="h-5 w-5 fill-current" />
            {isPlaying ? t("reading") : t("readAll")}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={items.length === 0}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all",
              "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <RotateCcw className="h-5 w-5" />
            {t("clear")}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[120px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <p className="text-center text-slate-400">{t("emptySentence")}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {items.map((item, index) => {
            const label = getPictogramLabel(item, locale);
            return (
              <div key={`${item.id}-${index}`} className="relative">
                <PictogramCard pictogram={item} size="sm" />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-110 active:scale-95"
                  aria-label={t("removePictogram", { name: label })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="mt-4 text-center text-lg font-medium text-indigo-700">
          {items.map((i) => getPictogramLabel(i, locale)).join(" · ")}
        </p>
      )}
    </section>
  );
}

export function useAddToSentence() {
  const addItem = useSentenceStore((s) => s.addItem);
  const locale = useLocale();

  return async (pictogram: Parameters<typeof addItem>[0]) => {
    addItem(pictogram);
    try {
      await speak(getPictogramLabel(pictogram, locale), locale);
    } catch {
      // TTS failures are non-blocking
    }
  };
}
