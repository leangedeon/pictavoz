"use client";

import { Suspense, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PasswordInput } from "@/components/password-input";

function parseRedirectParam(redirectParam: string | null): string | null {
  if (!redirectParam || !redirectParam.startsWith("/")) return null;
  for (const l of routing.locales) {
    if (redirectParam === `/${l}`) return "/comunicar";
    if (redirectParam.startsWith(`/${l}/`)) {
      return redirectParam.slice(`/${l}`.length);
    }
  }
  return redirectParam;
}

function RegisterForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirectTo = parseRedirectParam(searchParams.get("redirect"));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const key = data.error as string;
        setError(key === "emailTaken" ? t("emailTaken") : t("authError"));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        const destination = redirectTo ?? "/comunicar";
        router.push(destination);
        router.refresh();
      }, 1500);
    } catch {
      setError(t("authError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div />
          <LanguageSwitcher />
        </div>

        <div className="mb-8 text-center">
          <span className="text-5xl">🗣️</span>
          <h1 className="mt-3 text-3xl font-bold text-indigo-700">
            {tCommon("appName")}
          </h1>
          <p className="mt-2 text-slate-500">{tCommon("tagline")}</p>
        </div>

        <h2 className="mb-4 text-center text-lg font-semibold text-slate-700">
          {t("registerTitle")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              {t("fullName")}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder={t("fullNamePlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              {t("email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              {t("password")}
            </label>
            <PasswordInput
              id="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {t("registerSuccess")}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("registerButton")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("hasAccount")}{" "}
          <Link
            href={
              redirectTo
                ? `/login?redirect=${encodeURIComponent(redirectTo)}`
                : "/login"
            }
            className="font-semibold text-indigo-600 hover:underline"
          >
            {t("goLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function RegisterFallback() {
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-8 py-10 shadow-2xl">
        <span className="text-4xl">🗣️</span>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">{tCommon("loading")}</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
