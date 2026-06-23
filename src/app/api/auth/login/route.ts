import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { verifyPassword } from "@/lib/password";
import { createToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDb();

    const { data: user, error } = await db
      .from(TABLES.users)
      .select("id, email, full_name, role, locale, password_hash")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: "invalidCredentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "invalidCredentials" },
        { status: 401 }
      );
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
    const message = err instanceof Error ? err.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
