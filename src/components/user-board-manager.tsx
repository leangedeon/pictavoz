"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Check,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { PictogramCard } from "@/components/pictogram-card";
import type { Category, Pictogram } from "@/types";
import { cn } from "@/lib/utils";
import {
  activateBoard,
  createBoard,
  createBoardShareLink,
  deletePictogram,
  fetchBoardStatus,
  fetchCategories,
  fetchPictograms,
  resetPersonalBoard,
  updatePictogram,
  type BoardStatus,
} from "@/lib/pictograms-client";
import { useAppDialog } from "@/components/app-dialog-provider";

interface EditForm {
  name_es: string;
  name_en: string;
  emoji: string;
  category_id: string;
  clear_image: boolean;
}

export function UserBoardManager() {
  const t = useTranslations("board");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categories");
  const locale = useLocale();
  const { confirm, prompt } = useAppDialog();

  const [boardStatus, setBoardStatus] = useState<BoardStatus | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pictograms, setPictograms] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editing, setEditing] = useState<Pictogram | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [switchingBoard, setSwitchingBoard] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryLabel = (slug: string) => {
    try {
      return tCat(slug as Parameters<typeof tCat>[0]);
    } catch {
      return slug;
    }
  };

  const loadAll = useCallback(async () => {
    const [status, cats, all] = await Promise.all([
      fetchBoardStatus(),
      fetchCategories<Category>(),
      fetchPictograms(categoryFilter || null, search || undefined, {
        includeHidden: true,
      }),
    ]);

    setBoardStatus(status);
    setCategories(cats);
    setPictograms(all);
  }, [categoryFilter, search]);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

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

      await updatePictogram(editing.id, body);
      await loadAll();
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleHide = async (pictogram: Pictogram, closeAfter = false) => {
    setSaving(true);
    setError("");
    try {
      const updated = await updatePictogram(pictogram.id, { is_hidden: true });
      setPictograms((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setEditing((current) =>
        current?.id === updated.id ? updated : current
      );
      await loadAll();
      if (closeAfter) closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleShow = async (pictogram: Pictogram, closeAfter = false) => {
    setSaving(true);
    setError("");
    try {
      const updated = await updatePictogram(pictogram.id, { is_hidden: false });
      setPictograms((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setEditing((current) =>
        current?.id === updated.id ? updated : current
      );
      await loadAll();
      if (closeAfter) closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustom = async (pictogram: Pictogram) => {
    const accepted = await confirm({
      title: t("delete"),
      message: t("deleteConfirm", { name: pictogram.name_es }),
      variant: "danger",
      confirmLabel: t("delete"),
    });
    if (!accepted) return;
    setError("");
    try {
      await deletePictogram(pictogram.id);
      if (editing?.id === pictogram.id) closeEdit();
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteError"));
    }
  };

  const handleReset = async () => {
    const accepted = await confirm({
      title: t("resetBoard"),
      message: t("resetConfirm"),
      variant: "danger",
      confirmLabel: t("resetBoard"),
    });
    if (!accepted) return;
    setError("");
    try {
      const status = await resetPersonalBoard(boardStatus?.activeBoardId ?? undefined);
      if (status) setBoardStatus(status);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("resetError"));
    }
  };

  const handleSwitchBoard = async (boardId: string) => {
    if (boardId === boardStatus?.activeBoardId) return;
    setSwitchingBoard(true);
    setError("");
    try {
      const status = await activateBoard(boardId);
      if (status) setBoardStatus(status);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("switchError"));
    } finally {
      setSwitchingBoard(false);
    }
  };

  const handleCreateBoard = async () => {
    const name = await prompt({
      title: t("newBoard"),
      label: t("newBoardPrompt"),
      message: "",
      confirmLabel: t("newBoard"),
    });
    if (name === null) return;

    setCreatingBoard(true);
    setError("");
    try {
      const status = await createBoard(name.trim() || undefined);
      if (status) setBoardStatus(status);
      await loadAll();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("createBoardError");
      setError(message === "maxBoardsReached" ? t("maxBoardsReached") : message);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleShareBoard = async () => {
    const boardId = boardStatus?.activeBoardId;
    if (!boardId) return;

    setSharing(true);
    setShareCopied(false);
    setError("");

    try {
      const token = await createBoardShareLink(boardId);
      const url = `${window.location.origin}/${locale}/compartir/${token}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("shareError"));
    } finally {
      setSharing(false);
    }
  };

  const activeBoard = boardStatus?.boards.find(
    (b) => b.id === boardStatus.activeBoardId
  );

  const isCustom = (pictogram: Pictogram) => !pictogram.source_system_id;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "rounded-2xl border-2 p-4",
          boardStatus?.hasPersonalBoard
            ? "border-indigo-200 bg-indigo-50/60"
            : "border-slate-200 bg-slate-50/80"
        )}
      >
        <p className="font-semibold text-slate-800">
          {boardStatus?.hasPersonalBoard ? t("personalActive") : t("usingDefault")}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {boardStatus?.hasPersonalBoard ? t("personalHint") : t("defaultHint")}
        </p>

        {(boardStatus?.hasPersonalBoard || boardStatus?.canCreateBoard) && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {boardStatus?.boards.length ? (
              <div className="min-w-[200px] flex-1">
                <label
                  htmlFor="boardSelect"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {t("selectBoard")}
                </label>
                <select
                  id="boardSelect"
                  value={boardStatus.activeBoardId ?? ""}
                  onChange={(e) => handleSwitchBoard(e.target.value)}
                  disabled={switchingBoard}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
                >
                  {boardStatus.boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                      {board.is_active ? ` (${t("activeBoard")})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {boardStatus?.canCreateBoard && (
                <button
                  type="button"
                  onClick={handleCreateBoard}
                  disabled={creatingBoard}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingBoard ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t("newBoard")}
                </button>
              )}

              {boardStatus?.hasPersonalBoard && (
                <>
                  <button
                    type="button"
                    onClick={handleShareBoard}
                    disabled={sharing}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {sharing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : shareCopied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    {shareCopied ? t("shareCopied") : t("shareBoard")}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t("resetBoard")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {boardStatus && (
          <p className="mt-3 text-xs text-slate-500">
            {t("boardLimit", {
              count: boardStatus.boardCount,
              max: boardStatus.maxBoardsPerUser,
            })}
            {activeBoard ? ` · ${activeBoard.name}` : ""}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
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

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {pictograms.map((pic) => (
          <div
            key={pic.id}
            className={cn(
              "relative transition-all duration-300",
              pic.is_hidden && "opacity-45 grayscale"
            )}
          >
            <PictogramCard
              pictogram={pic}
              size="sm"
              onClick={() => openEdit(pic)}
            />
            {pic.is_hidden && (
              <span className="pointer-events-none absolute right-1 top-1 z-10 -translate-x-5 rounded-full bg-slate-700/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {t("hiddenBadge")}
              </span>
            )}
          </div>
        ))}
      </div>

      {pictograms.length === 0 && (
        <p className="py-8 text-center text-slate-400">{tCommon("noResults")}</p>
      )}

      {editing && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">{t("editTitle")}</h3>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
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
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {tCommon("save")}
              </button>
              <button
                type="button"
                onClick={
                  editing.is_hidden
                    ? () => handleShow(editing, true)
                    : () => handleHide(editing, true)
                }
                disabled={saving}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold disabled:opacity-50",
                  editing.is_hidden
                    ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {editing.is_hidden ? (
                  <>
                    <Eye className="h-4 w-4" />
                    {t("restore")}
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    {t("hide")}
                  </>
                )}
              </button>
              {isCustom(editing) && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustom(editing)}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </button>
              )}
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
