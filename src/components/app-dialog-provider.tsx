"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, HelpCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogVariant = "default" | "danger";

interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface PromptOptions {
  message: string;
  title?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface AlertOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
}

type ActiveDialog =
  | {
      kind: "confirm";
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    }
  | {
      kind: "prompt";
      options: PromptOptions;
      resolve: (value: string | null) => void;
    }
  | {
      kind: "alert";
      options: AlertOptions;
      resolve: () => void;
    };

interface AppDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  alert: (options: AlertOptions) => Promise<void>;
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function useAppDialog(): AppDialogContextValue {
  const context = useContext(AppDialogContext);
  if (!context) {
    throw new Error("useAppDialog must be used within AppDialogProvider");
  }
  return context;
}

function DialogShell({
  title,
  message,
  icon,
  onClose,
  children,
}: {
  title?: string;
  message: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const descriptionId = message ? "app-dialog-message" : undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "app-dialog-title" : undefined}
        aria-describedby={descriptionId}
        className="w-full max-w-md rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
            {icon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            {title ? (
              <h2
                id="app-dialog-title"
                className="text-lg font-bold text-slate-800"
              >
                {title}
              </h2>
            ) : null}
            {message ? (
              <p
                id="app-dialog-message"
                className={cn(
                  "text-sm leading-relaxed text-slate-600",
                  title && "mt-1"
                )}
              >
                {message}
              </p>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActiveDialogView({
  dialog,
  onDismiss,
}: {
  dialog: ActiveDialog;
  onDismiss: () => void;
}) {
  const t = useTranslations("dialog");
  const tCommon = useTranslations("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [promptValue, setPromptValue] = useState(
    dialog.kind === "prompt" ? (dialog.options.defaultValue ?? "") : ""
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  useEffect(() => {
    if (dialog.kind === "prompt") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [dialog.kind]);

  if (dialog.kind === "alert") {
    const { options, resolve } = dialog;

    return (
      <DialogShell
        title={options.title}
        message={options.message}
        icon={<Info className="h-5 w-5 text-indigo-600" />}
        onClose={() => {
          resolve();
          onDismiss();
        }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            autoFocus
            onClick={() => {
              resolve();
              onDismiss();
            }}
            className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
          >
            {options.confirmLabel ?? t("ok")}
          </button>
        </div>
      </DialogShell>
    );
  }

  if (dialog.kind === "prompt") {
    const { options, resolve } = dialog;

    return (
      <DialogShell
        title={options.title}
        message={options.message}
        icon={<HelpCircle className="h-5 w-5 text-indigo-600" />}
        onClose={() => {
          resolve(null);
          onDismiss();
        }}
      >
        <div className="space-y-4">
          {options.label ? (
            <div>
              <label
                htmlFor="app-dialog-input"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                {options.label}
              </label>
              <input
                ref={inputRef}
                id="app-dialog-input"
                type="text"
                value={promptValue}
                onChange={(event) => setPromptValue(event.target.value)}
                placeholder={options.placeholder}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    resolve(promptValue);
                    onDismiss();
                  }
                }}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                resolve(null);
                onDismiss();
              }}
              className="rounded-2xl border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              {options.cancelLabel ?? tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={() => {
                resolve(promptValue);
                onDismiss();
              }}
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              {options.confirmLabel ?? t("confirm")}
            </button>
          </div>
        </div>
      </DialogShell>
    );
  }

  const { options, resolve } = dialog;
  const isDanger = options.variant === "danger";

  return (
    <DialogShell
      title={options.title}
      message={options.message}
      icon={
        isDanger ? (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        ) : (
          <HelpCircle className="h-5 w-5 text-indigo-600" />
        )
      }
      onClose={() => {
        resolve(false);
        onDismiss();
      }}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          autoFocus={!isDanger}
          onClick={() => {
            resolve(false);
            onDismiss();
          }}
          className="rounded-2xl border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          {options.cancelLabel ?? tCommon("cancel")}
        </button>
        <button
          type="button"
          autoFocus={isDanger}
          onClick={() => {
            resolve(true);
            onDismiss();
          }}
          className={cn(
            "rounded-2xl px-5 py-2.5 text-sm font-bold text-white",
            isDanger
              ? "bg-red-600 hover:bg-red-700"
              : "bg-indigo-600 hover:bg-indigo-700"
          )}
        >
          {options.confirmLabel ?? t("confirm")}
        </button>
      </div>
    </DialogShell>
  );
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null);

  const dismiss = useCallback(() => setDialog(null), []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ kind: "confirm", options, resolve });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setDialog({ kind: "prompt", options, resolve });
    });
  }, []);

  const alert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setDialog({ kind: "alert", options, resolve });
    });
  }, []);

  return (
    <AppDialogContext.Provider value={{ confirm, prompt, alert }}>
      {children}
      {dialog ? <ActiveDialogView dialog={dialog} onDismiss={dismiss} /> : null}
    </AppDialogContext.Provider>
  );
}
