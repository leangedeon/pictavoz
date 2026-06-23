"use client";

import { useTranslations } from "next-intl";
import { UserBoardManager } from "@/components/user-board-manager";

export default function PictogramasPage() {
  const t = useTranslations("board");

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-800 sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mb-6 text-slate-500">{t("pageSubtitle")}</p>
      <UserBoardManager />
    </div>
  );
}
