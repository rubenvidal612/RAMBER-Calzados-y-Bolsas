import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { shoeGalleryItems } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getDb().select().from(shoeGalleryItems).orderBy(desc(shoeGalleryItems.id));
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ items: [] }); }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as { category?: string; title?: string; caption?: string; imageUrl?: string };
  if (!body.title?.trim() || !body.imageUrl || !["dama", "infantil"].includes(body.category || "")) return NextResponse.json({ error: "Completa categoría, nombre y foto" }, { status: 400 });
  await getDb().insert(shoeGalleryItems).values({ category: body.category!, title: body.title.trim(), caption: body.caption?.trim() || "", imageUrl: body.imageUrl, createdAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Artículo inválido" }, { status: 400 });
  await getDb().delete(shoeGalleryItems).where(eq(shoeGalleryItems.id, id));
  return NextResponse.json({ ok: true });
}

async function isAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }
