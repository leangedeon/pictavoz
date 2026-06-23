import { getTranslations } from "next-intl/server";
import { BoardShareImport } from "@/components/board-share-import";
import { LanguageSwitcher } from "@/components/language-switcher";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ShareBoardPage({ params }: PageProps) {
  const { token } = await params;
  const tCommon = await getTranslations("common");

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗣️</span>
            <span className="text-lg font-bold text-indigo-700">
              {tCommon("appName")}
            </span>
          </div>
          <LanguageSwitcher />
        </div>

        <BoardShareImport token={token} />
      </div>
    </div>
  );
}
