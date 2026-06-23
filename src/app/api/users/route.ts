import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { TABLES } from "@/lib/db-tables";
import { getSession } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const db = getDb();
  const { data, error } = await db
    .from(TABLES.users)
    .select("id, email, full_name, role, locale, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
