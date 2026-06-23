"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import type { Category, Pictogram } from "@/types";
import { cn } from "@/lib/utils";
import { fetchCategories, fetchPictograms } from "@/lib/pictograms-client";
import { useAppDialog } from "@/components/app-dialog-provider";

interface EditForm {
  name_es: string;
  name_en: string;
  emoji: string;
  category_id: string;
  clear_image: boolean;
}

export function AdminSystemPictograms() {
  const t = useTranslations("admin.pictograms");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categories");
  const { confirm } = useAppDialog();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [editing, setEditing] = useState<Pictogram | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryLabel = (slug: string) => {
    try {
      return tCat(slug as Parameters<typeof tCat>[0]);
    } catch {
      return slug;
    }
  };

  const loadPictograms = useCallback(async () => {
    setPictograms(
      await fetchPictograms(categoryFilter || null, search || undefined, {
        systemOnly: true,
      })
    );
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchCategories<Category>().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadPictograms().finally(() => setLoading(false));
  }, [loadPictograms]);

  const openEdit = (pictogram: Pictogram) => {
    setEditing(pictogram);
    setForm({
      name_es: pictogram.name_es,
      name_en: pictogram.name_en,
      emoji: pictogram.emoji ?? "",
      category_id: pictogram.category_id,
      clear_image: false,
    });
    setPreview(pictogram.image_url);
    setImageFile(null);
    setError("");
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setPreview(null);
    setImageFile(null);
    setError("");
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setForm((current) =>
      current ? { ...current, clear_image: false } : current
    );
  };

  const handleSave = async () => {
    if (!editing || !form) return;
    if (!form.name_es.trim() || !form.category_id) {
      setError(t("fillRequired"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = new FormData();
      body.append("name_es", form.name_es.trim());
      body.append("name_en", form.name_en.trim());
      body.append("category_id", form.category_id);
      body.append("emoji", form.emoji.trim());
      body.append("clear_image", form.clear_image ? "true" : "false");
      if (imageFile) body.append("file", imageFile);

      const res = await fetch(`/api/pictograms/${editing.id}`, {
        method: "PATCH",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("updateError"));

      await loadPictograms();
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pictogram: Pictogram) => {
    const accepted = await confirm({
      title: t("delete"),
      message: t("deleteConfirm", { name: pictogram.name_es }),
      variant: "danger",
      confirmLabel: t("delete"),
    });
    if (!accepted) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/pictograms/${pictogram.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("deleteError"));

      if (editing?.id === pictogram.id) closeEdit();
      await loadPictograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteError"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">{t("title")}</h2>
        <p className="text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tCommon("search")}
            className="w-full rounded-xl border-2 border-slate-200 py-2.5 pl-10 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {categoryLabel(cat.slug)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : pictograms.length === 0 ? (
        <p className="py-12 text-center text-slate-400">{tCommon("noResults")}</p>
      ) : (
        <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("columns.image")}</th>
                <th className="px-4 py-3">{t("columns.name")}</th>
                <th className="px-4 py-3 hidden md:table-cell">
                  {t("columns.category")}
                </th>
                <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pictograms.map((pictogram) => (
                <tr key={pictogram.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white">
                      {pictogram.image_url ? (
                        <Image
                          src={pictogram.image_url}
                          alt={pictogram.name_es}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-2xl">{pictogram.emoji ?? "📋"}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {pictogram.name_es}
                    </p>
                    <p className="text-xs text-slate-500">{pictogram.name_en}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {pictogram.category
                      ? categoryLabel(pictogram.category.slug)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(pictogram)}
                        className="rounded-xl bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100"
                        aria-label={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pictogram)}
                        disabled={deleting}
                        className="rounded-xl bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-400">
        {t("count", { count: pictograms.length })}
      </p>

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{t("editTitle")}</h3>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 flex flex-col items-center gap-3">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-indigo-100 bg-slate-50">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt={form.name_es}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">{form.emoji || "📋"}</span>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <Upload className="h-4 w-4" />
                  {t("uploadImage")}
                </button>
                {(preview || editing.image_url) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setImageFile(null);
                      setForm({ ...form, clear_image: true });
                    }}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    {t("useEmoji")}
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {t("nameEs")}
                </label>
                <input
                  type="text"
                  value={form.name_es}
                  onChange={(e) =>
                    setForm({ ...form, name_es: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {t("nameEn")}
                </label>
                <input
                  type="text"
                  value={form.name_en}
                  onChange={(e) =>
                    setForm({ ...form, name_en: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {t("emoji")}
                </label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) =>
                    setForm({ ...form, emoji: e.target.value })
                  }
                  placeholder="🍎"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  {t("category")}
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
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

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                )}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {tCommon("save")}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(editing)}
                disabled={deleting}
                className="rounded-2xl border-2 border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {t("delete")}
              </button>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {tCommon("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
