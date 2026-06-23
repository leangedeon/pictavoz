import { getTranslations } from "next-intl/server";
import { CreatePictogramForm } from "@/components/create-pictogram-form";

export default async function CrearPage() {
  const t = await getTranslations("create");

  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-800 sm:text-3xl">
        {t("title")}
      </h1>
      <CreatePictogramForm />
    </div>
  );
}
