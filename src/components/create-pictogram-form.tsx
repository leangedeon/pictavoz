"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Upload, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import type { Category } from "@/types";

export function CreatePictogramForm() {
  const t = useTranslations("create");
  const tCat = useTranslations("categories");
  const router = useRouter();
  const locale = useLocale();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      });
  }, []);

  const categoryLabel = (slug: string) => {
    try {
      return tCat(slug as Parameters<typeof tCat>[0]);
    } catch {
      return slug;
    }
  };

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || !categoryId) {
      setError(t("fillAllFields"));
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name.trim());
    formData.append("category_id", categoryId);
    formData.append("locale", locale);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      router.push("/pictogramas");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("fillAllFields"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-lg">
        <h2 className="mb-6 text-xl font-bold text-slate-800">{t("formTitle")}</h2>

        {preview ? (
          <div className="relative mx-auto mb-6 h-48 w-48 overflow-hidden rounded-2xl border-4 border-indigo-100 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={t("preview")}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-2xl border-4 border-dashed border-slate-200 bg-slate-50">
            <span className="text-6xl opacity-30">📷</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl bg-indigo-50 py-6 text-indigo-700 transition-colors hover:bg-indigo-100 active:scale-95"
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm font-semibold">{t("takePhoto")}</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl bg-purple-50 py-6 text-purple-700 transition-colors hover:bg-purple-100 active:scale-95"
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-semibold">{t("uploadPhoto")}</span>
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              {t("nameLabel")}
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              {t("categoryLabel")}
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {categoryLabel(cat.slug)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">{t("forkNotice")}</p>

        <button
          type="submit"
          disabled={loading || !file || !name.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("saving")}
            </>
          ) : (
            t("saveButton")
          )}
        </button>
      </div>
    </form>
  );
}
