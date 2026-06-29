import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getSessionFromRequest } from "@/lib/auth";

const intlMiddleware = createMiddleware(routing);

const authPublicPaths = ["/login", "/register"];
const sharePathPrefix = "/compartir";

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (routing.locales.includes(segments[1] as "en" | "es")) {
    return "/" + segments.slice(2).join("/");
  }
  return pathname;
}

function isSharePath(pathWithoutLocale: string): boolean {
  return pathWithoutLocale.startsWith(`${sharePathPrefix}/`);
}

function isLandingPath(pathWithoutLocale: string): boolean {
  return pathWithoutLocale === "/" || pathWithoutLocale === "";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);
  const pathWithoutLocale = stripLocale(pathname);
  const isAuthPage = authPublicPaths.some((p) =>
    pathWithoutLocale.startsWith(p)
  );
  const isPublic =
    isAuthPage || isSharePath(pathWithoutLocale) || isLandingPath(pathWithoutLocale);
  const session = await getSessionFromRequest(request);

  const locale =
    routing.locales.find((l) => pathname.startsWith(`/${l}`)) ??
    routing.defaultLocale;

  if (!session && !isPublic) {
    const redirectParam = encodeURIComponent(pathname);
    return NextResponse.redirect(
      new URL(`/${locale}/login?redirect=${redirectParam}`, request.url)
    );
  }

  if (session && (isAuthPage || isLandingPath(pathWithoutLocale))) {
    return NextResponse.redirect(
      new URL(`/${locale}/comunicar`, request.url)
    );
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
