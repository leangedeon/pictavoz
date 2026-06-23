import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { hashPassword } from "@/lib/password";
import { createToken, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import type { Locale } from "@/i18n/routing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName, locale = "es" } = body as {
      email: string;
      password: string;
      fullName: string;
      locale?: Locale;
    };

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = getDb();

    const { data: existing } = await db
      .from(TABLES.users)
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "emailTaken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { data: user, error } = await db
      .from(TABLES.users)
      .insert({
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: fullName.trim(),
        locale: locale === "en" ? "en" : "es",
        role: "user",
      })
      .select("id, email, full_name, role, locale")
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message ?? "Registration failed" },
        { status: 500 }
      );
    }

    try {
      await sendWelcomeEmail({
        to: user.email,
        name: user.full_name ?? user.email,
        locale: locale === "en" ? "en" : "es",
      });
    } catch (mailError) {
      console.error("Welcome email failed:", mailError);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        locale: user.locale,
      },
    });

    return setSessionCookie(response, token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
