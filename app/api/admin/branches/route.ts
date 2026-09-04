import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { branches } from "@/db/schema";

export const dynamic = "force-dynamic";
async function isAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ items: await getDb().select().from(branches).orderBy(asc(branches.name)) });
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as { id?: string; name?: string; shortName?: string; address?: string; phone?: string; isActive?: boolean };
  if (!body.id || !body.name?.trim() || !body.shortName?.trim()) return NextResponse.json({ error: "Completa nombre y nombre corto." }, { status: 400 });
  await getDb().update(branches).set({ name: body.name.trim(), shortName: body.shortName.trim(), address: body.address?.trim() || "", phone: body.phone?.trim() || "", isActive: body.isActive !== false }).where(eq(branches.id, body.id));
  return NextResponse.json({ ok: true });
}
