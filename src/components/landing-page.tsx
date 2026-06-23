"use client";

import { useTranslations } from "next-intl";
import {
  Grid3X3,
  MessageCircle,
  Mic,
  PlusCircle,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

const featureIcons = [MessageCircle, Grid3X3, Mic, Share2] as const;
const stepNumbers = ["1", "2", "3"] as const;

export function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const features = [
    {
      icon: featureIcons[0],
      title: t("features.communicate.title"),
      description: t("features.communicate.description"),
    },
    {
      icon: featureIcons[1],
      title: t("features.boards.title"),
      description: t("features.boards.description"),
    },
    {
      icon: featureIcons[2],
      title: t("features.voice.title"),
      description: t("features.voice.description"),
    },
    {
      icon: featureIcons[3],
      title: t("features.share.title"),
      description: t("features.share.description"),
    },
  ];

  const steps = [
    { number: stepNumbers[0], title: t("steps.one.title"), text: t("steps.one.text") },
    { number: stepNumbers[1], title: t("steps.two.title"), text: t("steps.two.text") },
    { number: stepNumbers[2], title: t("steps.three.title"), text: t("steps.three.text") },
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-3xl">🗣️</span>
            <span className="text-xl font-bold text-indigo-700 sm:text-2xl">
              {tCommon("appName")}
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher className="hidden sm:flex" />
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 sm:px-4"
            >
              {tAuth("loginButton")}
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 active:scale-[0.98] sm:px-5 sm:py-2.5"
            >
              {tAuth("registerButton")}
            </Link>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-2 sm:hidden">
          <LanguageSwitcher />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
            <div className="absolute -right-16 top-32 h-80 w-80 rounded-full bg-purple-300/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-pink-300/20 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                {t("badge")}
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                {t("heroSubtitle")}
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-[0.98]"
                >
                  {t("ctaPrimary")}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 transition-all hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  {t("ctaSecondary")}
                </Link>
              </div>

              <p className="mt-6 text-sm text-slate-500">{t("heroNote")}</p>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="rounded-3xl border-2 border-indigo-100 bg-white/90 p-6 shadow-2xl shadow-indigo-100/50 backdrop-blur sm:p-8">
                <p className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">
                  {t("previewLabel")}
                </p>
                <div className="mb-4 rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/50 px-4 py-3 text-center">
                  <p className="text-lg font-bold text-indigo-800">
                    {t("previewSentence")}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {["🍎", "🥛", "😊", "🏠", "👋", "❤️", "🎮", "🐕"].map(
                    (emoji, index) => (
                      <div
                        key={emoji}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl shadow-sm sm:text-3xl",
                          index < 3
                            ? "border-emerald-200 bg-emerald-50 ring-2 ring-emerald-300/50"
                            : "border-slate-100 bg-white"
                        )}
                      >
                        {emoji}
                      </div>
                    )
                  )}
                </div>
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
                    <Mic className="h-4 w-4" />
                    {t("previewVoice")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-indigo-100/80 bg-white/60 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {t("featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-slate-600">{t("featuresSubtitle")}</p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-3xl border-2 border-indigo-50 bg-white p-6 shadow-lg shadow-indigo-50/50 transition-transform hover:-translate-y-1"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  {t("createTitle")}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                  {t("createDescription")}
                </p>
                <ul className="mt-8 space-y-4">
                  {[t("createPoint1"), t("createPoint2"), t("createPoint3")].map(
                    (point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          ✓
                        </span>
                        <span className="text-slate-700">{point}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 p-8 text-white shadow-2xl">
                <PlusCircle className="h-10 w-10 opacity-90" />
                <h3 className="mt-4 text-2xl font-bold">{t("createCardTitle")}</h3>
                <p className="mt-3 leading-relaxed text-indigo-50">
                  {t("createCardText")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/70 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {t("stepsTitle")}
              </h2>
              <p className="mt-4 text-lg text-slate-600">{t("stepsSubtitle")}</p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map(({ number, title, text }) => (
                <div key={number} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-extrabold text-white shadow-lg shadow-indigo-200">
                    {number}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-800">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-12 text-center shadow-2xl shadow-indigo-300/30 sm:px-12 sm:py-16">
            <Users className="mx-auto h-10 w-10 text-indigo-200" />
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
              {t("ctaDescription")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 active:scale-[0.98]"
              >
                {t("ctaPrimary")}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10"
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-indigo-100 bg-white/80 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗣️</span>
            <div>
              <p className="font-bold text-indigo-700">{tCommon("appName")}</p>
              <p className="text-sm text-slate-500">{tCommon("tagline")}</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">{t("footer")}</p>
        </div>
      </footer>
    </div>
  );
}
