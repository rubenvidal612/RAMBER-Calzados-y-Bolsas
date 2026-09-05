import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { shoeProductImages, shoeProducts, shoeProductSizes } from "@/db/schema";

export const dynamic = "force-dynamic";
type Payload = { category?: "dama" | "infantil"; model?: string; sku?: string; name?: string; description?: string; color?: string; publicPrice?: number; promoPrice?: number | null; inOffer?: boolean; isActive?: boolean; primaryImageUrl?: string; imageUrls?: string[]; sizes?: string[] };

async function requireAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }
function cleanPayload(body: Payload) {
  const sizes = Array.from(new Set((body.sizes || []).map(String).filter(Boolean)));
  const imageUrls = Array.from(new Set((body.imageUrls || []).map(String).filter(Boolean)));
  const category = body.category;
  if (!category || !["dama", "infantil"].includes(category) || !body.model?.trim() || !body.name?.trim() || !body.color?.trim() || !Number.isInteger(body.publicPrice) || body.publicPrice < 0 || !sizes.length || !body.primaryImageUrl || !imageUrls.length) return null;
  if (body.promoPrice !== null && body.promoPrice !== undefined && (!Number.isInteger(body.promoPrice) || body.promoPrice < 0)) return null;
  return { category, model: body.model.trim(), sku: body.sku?.trim() || null, name: body.name.trim(), description: body.description?.trim() || "", color: body.color.trim(), publicPrice: body.publicPrice, promoPrice: body.promoPrice ?? null, inOffer: Boolean(body.inOffer), isActive: body.isActive !== false, primaryImageUrl: body.primaryImageUrl, imageUrls, sizes };
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const category = new URL(request.url).searchParams.get("category");
  const db = getDb();
  const products = await db.select().from(shoeProducts).where(category && ["dama", "infantil"].includes(category) ? eq(shoeProducts.category, category) : undefined).orderBy(desc(shoeProducts.id));
  const ids = products.map((product) => product.id);
  const [sizes, images] = ids.length ? await Promise.all([
    db.select().from(shoeProductSizes).where(inArray(shoeProductSizes.productId, ids)).orderBy(asc(shoeProductSizes.size)),
    db.select().from(shoeProductImages).where(inArray(shoeProductImages.productId, ids)).orderBy(asc(shoeProductImages.sortOrder)),
  ]) : [[], []];
  return NextResponse.json({ items: products.map((product) => ({ ...product, sizes: sizes.filter((size) => size.productId === product.id).map((size) => size.size), images: images.filter((image) => image.productId === product.id).map((image) => image.imageUrl) })) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const data = cleanPayload(await request.json() as Payload);
  if (!data) return NextResponse.json({ error: "Completa modelo, nombre, color, tallas, precio y foto." }, { status: 400 });
  const db = getDb(); const now = new Date().toISOString();
  try {
    const { imageUrls, sizes, ...product } = data;
    await db.insert(shoeProducts).values({ ...product, createdAt: now, updatedAt: now });
    const [created] = await db.select().from(shoeProducts).where(and(eq(shoeProducts.category, data.category), eq(shoeProducts.model, data.model))).orderBy(desc(shoeProducts.id)).limit(1);
    if (!created) throw new Error("No se pudo crear el producto");
    await db.batch([
      ...sizes.map((size) => db.insert(shoeProductSizes).values({ productId: created.id, size })),
      ...imageUrls.map((imageUrl, index) => db.insert(shoeProductImages).values({ productId: created.id, imageUrl, sortOrder: index })),
    ]);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar";
    if (/unique/i.test(message)) return NextResponse.json({ error: "Ya existe un producto con ese modelo o SKU." }, { status: 409 });
    return NextResponse.json({ error: "No se pudo guardar el producto." }, { status: 500 });
  }
}
