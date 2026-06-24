"use client";

import { cn } from "@/lib/utils";

interface OwnershipFilterProps {
  value: "all" | "mine";
  onChange: (value: "all" | "mine") => void;
  allLabel: string;
  mineLabel: string;
  className?: string;
}

export function OwnershipFilter({
  value,
  onChange,
  allLabel,
  mineLabel,
  className,
}: OwnershipFilterProps) {
  const options = [
    { id: "all" as const, label: allLabel },
    { id: "mine" as const, label: mineLabel },
  ];

  return (
    <div
      role="group"
      aria-label={allLabel}
      className={cn(
        "flex h-12 rounded-2xl border-2 border-slate-200 bg-white p-1",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "flex h-full flex-1 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all active:scale-[0.98] sm:flex-none sm:px-5 sm:whitespace-nowrap",
            value === option.id
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
