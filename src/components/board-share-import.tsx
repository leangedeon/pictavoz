"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Check, Copy, Loader2, Share2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { BoardStatus } from "@/lib/pictograms-client";
import type { SharedBoardPreview } from "@/lib/board-share";

interface ShareImportStatus {
  isOwner: boolean;
  canImport: boolean;
  boardCount?: number;
  maxBoardsPerUser?: number;
}

interface ShareResponse {
  preview: SharedBoardPreview;
  importStatus: ShareImportStatus | null;
}

export function BoardShareImport({ token }: { token: string }) {
  const t = useTranslations("share");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [data, setData] = useState<ShareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const sharePath = `/compartir/${token}`;

  useEffect(() => {
    fetch(`/api/board/share/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "shareNotFound");
        }
        setData(json);
      })
      .catch((err) => {
        setError(
          err instanceof Error && err.message === "shareNotFound"
            ? t("notFound")
            : t("loadError")
        );
      })
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleImport = async () => {
    setImporting(true);
    setError("");

    try {
      const res = await fetch(`/api/board/share/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        const key = json.error as string;
        if (key === "maxBoardsReached") throw new Error(t("maxBoardsReached"));
        if (key === "cannotCopyOwnBoard") throw new Error(t("ownBoard"));
        if (key === "shareNotFound") throw new Error(t("notFound"));
        throw new Error(t("importError"));
      }

      setImported(true);
      setData((current) =>
        current
          ? {
              ...current,
              importStatus: {
                isOwner: false,
                canImport: false,
                boardCount: (json.status as BoardStatus)?.boardCount,
                maxBoardsPerUser: (json.status as BoardStatus)?.maxBoardsPerUser,
              },
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t("importError"));
    } finally {
      setImporting(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${locale}${sharePath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("copyError"));
    }
  };

  const loginHref = `/login?redirect=${encodeURIComponent(sharePath)}`;
  const registerHref = `/register?redirect=${encodeURIComponent(sharePath)}`;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { preview, importStatus } = data;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <Share2 className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{t("title")}</h2>
        <p className="mt-2 text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
          {t("boardLabel")}
        </p>
        <p className="mt-1 text-xl font-bold text-slate-800">
          {preview.boardName}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          {t("sharedBy", { name: preview.ownerName })}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white px-3 py-2">
            <dt className="text-slate-500">{t("visiblePictograms")}</dt>
            <dd className="font-bold text-slate-800">{preview.visibleCount}</dd>
          </div>
          <div className="rounded-xl bg-white px-3 py-2">
            <dt className="text-slate-500">{t("customPictograms")}</dt>
            <dd className="font-bold text-slate-800">{preview.customCount}</dd>
          </div>
        </dl>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {imported ? (
        <div className="space-y-4 rounded-2xl bg-emerald-50 px-4 py-5 text-center">
          <Check className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="font-semibold text-emerald-800">{t("importSuccess")}</p>
          <button
            type="button"
            onClick={() => router.push("/pictogramas")}
            className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {t("goToBoards")}
          </button>
        </div>
      ) : importStatus?.isOwner ? (
        <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
          {t("ownBoard")}
        </p>
      ) : importStatus ? (
        importStatus.canImport ? (
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {importing && <Loader2 className="h-5 w-5 animate-spin" />}
            {t("importButton")}
          </button>
        ) : (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            {t("maxBoardsReached", {
              max: importStatus.maxBoardsPerUser ?? 5,
            })}
          </p>
        )
      ) : (
        <div className="space-y-3 rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
          <p className="text-sm text-slate-600">{t("loginRequired")}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href={registerHref}
              className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              {tAuth("registerButton")}
            </Link>
            <Link
              href={loginHref}
              className="rounded-2xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              {tAuth("loginButton")}
            </Link>
          </div>
        </div>
      )}

      {importStatus?.isOwner && (
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? t("linkCopied") : t("copyLink")}
        </button>
      )}

      <p className="text-center text-xs text-slate-400">
        {tCommon("appName")}
      </p>
    </div>
  );
}
