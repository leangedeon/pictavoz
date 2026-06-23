"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
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

function LoginForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = parseRedirectParam(searchParams.get("redirect"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const key = data.error as string;
        setError(
          key === "invalidCredentials" ? t("invalidCredentials") : t("authError")
        );
        return;
      }

      const destination = redirectTo ?? "/comunicar";
      router.push(destination);
      router.refresh();
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
          {t("loginTitle")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("loginButton")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {t("noAccount")}{" "}
          <Link
            href={
              redirectTo
                ? `/register?redirect=${encodeURIComponent(redirectTo)}`
                : "/register"
            }
            className="font-semibold text-indigo-600 hover:underline"
          >
            {t("goRegister")}
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
