import { getTranslations } from "next-intl/server";
import { PictogramBrowser } from "@/components/pictogram-browser";

export default async function ComunicarPage() {
  const t = await getTranslations("communicate");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">
        {t("title")}
      </h1>
      <PictogramBrowser />
    </div>
  );
}
