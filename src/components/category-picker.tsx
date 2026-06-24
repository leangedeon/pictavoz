"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryPickerProps {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  getCategoryLabel: (slug: string) => string;
  label?: string;
  id?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Shorter fixed height for toolbar/filter rows */
  compact?: boolean;
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  getCategoryLabel,
  label,
  id,
  allowEmpty = false,
  emptyLabel = "",
  disabled = false,
  className,
  compact = false,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = categories.find((category) => category.id === value);

  const triggerLabel =
    !value && allowEmpty
      ? emptyLabel
      : selected
        ? `${selected.icon ?? ""} ${getCategoryLabel(selected.slug)}`.trim()
        : emptyLabel;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
      ) : null}

      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition-all",
          compact ? "h-12" : "py-3.5",
          "hover:border-indigo-200 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100",
          "active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-indigo-400 ring-4 ring-indigo-100"
        )}
      >
        <span className="truncate text-left">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180 text-indigo-500"
          )}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={id}
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-xl"
        >
          {allowEmpty ? (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.99]",
                  !value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-indigo-50"
                )}
              >
                <span className="truncate">{emptyLabel}</span>
                {!value ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            </li>
          ) : null}

          {categories.map((category) => {
            const isSelected = value === category.id;

            return (
              <li key={category.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.99]",
                    isSelected
                      ? "text-white shadow-sm"
                      : "text-slate-700 hover:bg-indigo-50"
                  )}
                  style={
                    isSelected ? { backgroundColor: category.color } : undefined
                  }
                >
                  <span className="flex min-w-0 items-center gap-2 truncate">
                    <span>{category.icon}</span>
                    {getCategoryLabel(category.slug)}
                  </span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
