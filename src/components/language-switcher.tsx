"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-slate-500">{t("language")}:</span>
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
        {routing.locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => switchLocale(loc)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold uppercase transition-colors",
              locale === loc
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:text-indigo-600"
            )}
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
}
