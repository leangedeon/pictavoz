"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageIcon, Settings, Shield, UserCog } from "lucide-react";
import { AdminSystemPictograms } from "@/components/admin-system-pictograms";
import { AdminSettings } from "@/components/admin-settings";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

type AdminTab = "pictograms" | "users" | "settings";

export function AdminPanel() {
  const t = useTranslations("admin");

  const [tab, setTab] = useState<AdminTab>("pictograms");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
          <p className="text-sm text-slate-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setTab("pictograms")}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all border-2",
            tab === "pictograms"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
          )}
        >
          <ImageIcon className="h-4 w-4" />
          {t("tabs.pictograms")}
        </button>
        <button
          type="button"
          onClick={() => setTab("users")}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all border-2",
            tab === "users"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
          )}
        >
          <UserCog className="h-4 w-4" />
          {t("tabs.users")}
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all border-2",
            tab === "settings"
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200"
          )}
        >
          <Settings className="h-4 w-4" />
          {t("tabs.settings")}
        </button>
      </div>

      {tab === "pictograms" ? (
        <AdminSystemPictograms />
      ) : tab === "settings" ? (
        <AdminSettings />
      ) : (
        <div className="rounded-3xl border-2 border-indigo-100 bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-slate-800">{t("usersTitle")}</h2>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                    <UserCog className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <span className="rounded-xl bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                  {t(`roles.${user.role}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
