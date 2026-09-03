import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { newsItems, siteSettings } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const [settings, news] = await Promise.all([
      db.select().from(siteSettings),
      db.select().from(newsItems).orderBy(desc(newsItems.id)).limit(6),
    ]);
    return NextResponse.json({
      settings: Object.fromEntries(settings.map((item) => [item.key, item.value])),
      news,
    });
  } catch {
    return NextResponse.json({ settings: {}, news: [] });
  }
}

export async function PUT(request: Request) {
  const authorized = await requireAdmin();
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as { key?: string; value?: string };
  if (!body.key || typeof body.value !== "string") return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  const db = getDb();
  await db.insert(siteSettings).values({ key: body.key, value: body.value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: body.value, updatedAt: new Date().toISOString() } });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const authorized = await requireAdmin();
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as { title?: string; body?: string; imageUrl?: string };
  if (!body.title?.trim()) return NextResponse.json({ error: "Escribe un título" }, { status: 400 });
  const db = getDb();
  const createdAt = new Date().toISOString();
  await db.insert(newsItems).values({ title: body.title.trim(), body: body.body?.trim() || "", imageUrl: body.imageUrl || "", createdAt });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const authorized = await requireAdmin();
  if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Novedad inválida" }, { status: 400 });
  await getDb().delete(newsItems).where(eq(newsItems.id, id));
  return NextResponse.json({ ok: true });
}

async function requireAdmin() {
  const { hasAdminSession } = await import("@/app/admin-auth");
  return hasAdminSession();
}
