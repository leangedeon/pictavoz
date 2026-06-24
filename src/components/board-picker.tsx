"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { UserBoard } from "@/types";
import { cn } from "@/lib/utils";

interface BoardPickerProps {
  boards: UserBoard[];
  value: string;
  onChange: (boardId: string) => void;
  activeSuffix: string;
  label?: string;
  labelClassName?: string;
  id?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  compact?: boolean;
}

export function BoardPicker({
  boards,
  value,
  onChange,
  activeSuffix,
  label,
  labelClassName,
  id,
  disabled = false,
  loading = false,
  className,
  compact = false,
}: BoardPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = boards.find((board) => board.id === value);
  const triggerLabel = selected?.name ?? "";

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

  const getBoardLabel = (board: UserBoard) =>
    board.is_active ? `${board.name} (${activeSuffix})` : board.name;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label ? (
        <label
          htmlFor={id}
          className={
            labelClassName ??
            "mb-1.5 block text-sm font-semibold text-slate-700"
          }
        >
          {label}
        </label>
      ) : null}

      <button
        id={id}
        type="button"
        disabled={disabled || loading}
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
        {loading ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-indigo-500" />
        ) : (
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-slate-400 transition-transform",
              open && "rotate-180 text-indigo-500"
            )}
          />
        )}
      </button>

      {open && !loading ? (
        <ul
          role="listbox"
          aria-labelledby={id}
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border-2 border-indigo-100 bg-white p-2 shadow-xl"
        >
          {boards.map((board) => {
            const isSelected = value === board.id;

            return (
              <li key={board.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(board.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.99]",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-700 hover:bg-indigo-50"
                  )}
                >
                  <span className="truncate">{getBoardLabel(board)}</span>
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
