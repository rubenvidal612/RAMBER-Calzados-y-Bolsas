import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bagProducts } from "@/db/schema";

export const dynamic = "force-dynamic";
type BagPayload = { catalog?: string; code?: string; family?: string; color?: string; measurements?: string; features?: string; image?: string; isActive?: boolean };

async function requireAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }
function clean(body: BagPayload) {
  const catalog = body.catalog === "2" ? "2" : "1";
  if (!body.code?.trim() || !body.family?.trim() || !body.color?.trim() || !body.image?.trim()) return null;
  return { catalog, code: body.code.trim(), family: body.family.trim(), color: body.color.trim(), measurements: body.measurements?.trim() || "", features: body.features?.trim() || "", image: body.image.trim(), isActive: body.isActive !== false };
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const catalog = new URL(request.url).searchParams.get("catalog");
  const items = await getDb().select().from(bagProducts).where(catalog ? eq(bagProducts.catalog, catalog) : undefined).orderBy(asc(bagProducts.catalog), asc(bagProducts.code));
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const data = clean(await request.json() as BagPayload);
  if (!data) return NextResponse.json({ error: "Completa código, familia, color y foto." }, { status: 400 });
  const now = new Date().toISOString();
  try {
    await getDb().insert(bagProducts).values({ ...data, createdAt: now, updatedAt: now });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: /unique/i.test(message) ? "Ya existe una bolsa con ese código en ese catálogo." : "No se pudo guardar la bolsa." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as BagPayload & { id?: number };
  const id = Number(body.id);
  const data = clean(body);
  if (!Number.isInteger(id) || !data) return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
  try {
    await getDb().update(bagProducts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(bagProducts.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: /unique/i.test(message) ? "Ya existe una bolsa con ese código en ese catálogo." : "No se pudo actualizar la bolsa." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Bolsa inválida" }, { status: 400 });
  await getDb().delete(bagProducts).where(eq(bagProducts.id, id));
  return NextResponse.json({ ok: true });
}
