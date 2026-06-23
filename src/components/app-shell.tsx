"use client";

import { useEffect, useState } from "react";
import {
  Maximize,
  Minimize,
  MessageCircle,
  Grid3X3,
  PlusCircle,
  Shield,
  LogOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn, isAdminRole } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { User } from "@/types";

const navItems = [
  { href: "/comunicar" as const, labelKey: "communicate" as const, icon: MessageCircle },
  { href: "/pictogramas" as const, labelKey: "pictograms" as const, icon: Grid3X3 },
  { href: "/crear" as const, labelKey: "create" as const, icon: PlusCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  const [user, setUser] = useState<User | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser);

    const onFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const allNavItems = [
    ...navItems,
    ...(user && isAdminRole(user.role)
      ? [{ href: "/admin" as const, labelKey: "admin" as const, icon: Shield }]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/comunicar" className="flex items-center gap-2">
            <span className="text-2xl">🗣️</span>
            <span className="text-xl font-bold text-indigo-700">
              {tCommon("appName")}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {allNavItems.map(({ href, labelKey, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden sm:flex" />
            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100"
              title={
                isFullscreen
                  ? tCommon("exitFullscreen")
                  : tCommon("fullscreen")
              }
              aria-label={
                isFullscreen
                  ? tCommon("exitFullscreen")
                  : tCommon("fullscreen")
              }
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
              title={tCommon("logout")}
              aria-label={tCommon("logout")}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex border-t border-slate-100 md:hidden">
          {allNavItems.map(({ href, labelKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
                pathname === href
                  ? "text-indigo-700 bg-indigo-50"
                  : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {t(labelKey)}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
