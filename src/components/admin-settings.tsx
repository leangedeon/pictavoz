"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Settings } from "lucide-react";

export function AdminSettings() {
  const t = useTranslations("admin.settings");
  const tCommon = useTranslations("common");

  const [maxBoards, setMaxBoards] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.maxBoardsPerUser) {
          setMaxBoards(data.maxBoardsPerUser);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxBoardsPerUser: maxBoards }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("saveError"));
      setMaxBoards(data.maxBoardsPerUser);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-7 w-7 text-indigo-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">{t("title")}</h2>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <div>
          <label
            htmlFor="maxBoards"
            className="mb-1.5 block text-sm font-semibold text-slate-700"
          >
            {t("maxBoardsLabel")}
          </label>
          <input
            id="maxBoards"
            type="number"
            min={1}
            max={50}
            value={maxBoards}
            onChange={(e) => setMaxBoards(Number(e.target.value))}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          />
          <p className="mt-2 text-sm text-slate-500">{t("maxBoardsHint")}</p>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {t("saveSuccess")}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {tCommon("save")}
        </button>
      </div>
    </div>
  );
}
