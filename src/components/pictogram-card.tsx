"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { getPictogramLabel } from "@/lib/pictogram-label";
import type { Pictogram } from "@/types";

interface PictogramCardProps {
  pictogram: Pictogram;
  onClick?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "w-20 h-20 sm:w-24 sm:h-24",
  md: "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32",
  lg: "w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36",
};

const emojiSizes = {
  sm: "text-3xl sm:text-4xl",
  md: "text-4xl sm:text-5xl",
  lg: "text-5xl sm:text-6xl",
};

export function PictogramCard({
  pictogram,
  onClick,
  selected,
  size = "md",
  showLabel = true,
}: PictogramCardProps) {
  const locale = useLocale();
  const label = getPictogramLabel(pictogram, locale);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-2xl p-2 transition-all",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300",
        "active:scale-95 touch-manipulation",
        onClick && "cursor-pointer hover:scale-105",
        selected && "ring-4 ring-indigo-500 bg-indigo-50"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-white shadow-md border-2 border-slate-100",
          "group-hover:shadow-lg group-hover:border-indigo-200",
          sizeClasses[size]
        )}
      >
        {pictogram.image_url ? (
          <Image
            src={pictogram.image_url}
            alt={label}
            width={128}
            height={128}
            className="h-full w-full rounded-xl object-cover"
            unoptimized
          />
        ) : (
          <span className={emojiSizes[size]} role="img" aria-label={label}>
            {pictogram.emoji ?? "📋"}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="max-w-[100px] text-center text-sm font-semibold text-slate-700 leading-tight">
          {label}
        </span>
      )}
    </button>
  );
}
