import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { branchStock, inventoryMovements, shoeProductImages, shoeProductVariants, shoeProducts, shoeProductSizes } from "@/db/schema";
import { cleanProduct, type ProductPayload } from "./product-data";

export const dynamic = "force-dynamic";
async function requireAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }

export async function GET(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const category = new URL(request.url).searchParams.get("category");
  const db = getDb();
  const products = await db.select().from(shoeProducts).where(category && ["dama", "infantil"].includes(category) ? eq(shoeProducts.category, category) : undefined).orderBy(desc(shoeProducts.id));
  const ids = products.map((product) => product.id);
  const [variants, stocks, images] = ids.length ? await Promise.all([
    db.select().from(shoeProductVariants).where(inArray(shoeProductVariants.productId, ids)),
    db.select().from(branchStock),
    db.select().from(shoeProductImages).where(inArray(shoeProductImages.productId, ids)).orderBy(asc(shoeProductImages.sortOrder)),
  ]) : [[], [], []];
  return NextResponse.json({ items: products.map((product) => { const productVariants = variants.filter((variant) => variant.productId === product.id); const productStocks = stocks.filter((stock) => productVariants.some((variant) => variant.id === stock.variantId)); return { ...product, sizes: Array.from(new Set(productStocks.map((stock) => stock.size))).sort((a,b) => Number(a)-Number(b)).map((size) => ({ size, quantity: productStocks.filter((stock) => stock.size === size).reduce((sum, stock) => sum + stock.quantity, 0) })), variants: productVariants.map((variant) => ({ ...variant, stocks: stocks.filter((stock) => stock.variantId === variant.id) })), images: images.filter((image) => image.productId === product.id).map((image) => image.imageUrl) }; }) });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as ProductPayload & { isActive?: boolean };
  const data = cleanProduct(body);
  if (!data) return NextResponse.json({ error: "Completa nombre, color, tallas, precios válidos y foto. Revisa el descuento." }, { status: 400 });
  const db = getDb(); const now = new Date().toISOString();
  try {
    const { imageUrls, sizes, branchStocks, ...product } = data;
    await db.insert(shoeProducts).values({ ...product, isActive: body.isActive !== false, createdAt: now, updatedAt: now });
    const [created] = await db.select().from(shoeProducts).where(and(eq(shoeProducts.category, data.category), eq(shoeProducts.model, data.model))).orderBy(desc(shoeProducts.id)).limit(1);
    if (!created) throw new Error("No se pudo crear el producto");
    await db.insert(shoeProductVariants).values({ productId: created.id, color: data.color, createdAt: now, updatedAt: now });
    const [variant] = await db.select().from(shoeProductVariants).where(eq(shoeProductVariants.productId, created.id)).limit(1);
    if (!variant) throw new Error("No se pudo crear la variante");
    const sizeTotals = new Map(sizes.map((size) => [size.size, branchStocks.filter((stock) => stock.size === size.size).reduce((sum, stock) => sum + stock.quantity, 0)]));
    await db.batch([
      ...sizes.map((size) => db.insert(shoeProductSizes).values({ productId: created.id, size: size.size, quantity: sizeTotals.get(size.size) || 0 })),
      ...branchStocks.map((stock) => db.insert(branchStock).values({ variantId: variant.id, size: stock.size, branchId: stock.branchId, quantity: stock.quantity, updatedAt: now })),
      ...branchStocks.filter((stock) => stock.quantity > 0).map((stock) => db.insert(inventoryMovements).values({ id: crypto.randomUUID(), productId: created.id, variantId: variant.id, size: stock.size, branchId: stock.branchId, type: "OPENING_STOCK", quantityDelta: stock.quantity, quantityBefore: 0, quantityAfter: stock.quantity, reason: "Existencia inicial", createdAt: now })),
      ...imageUrls.map((imageUrl, index) => db.insert(shoeProductImages).values({ productId: created.id, imageUrl, sortOrder: index })),
    ]);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar";
    if (/unique/i.test(message)) return NextResponse.json({ error: "Ya existe un producto con ese modelo o SKU." }, { status: 409 });
    return NextResponse.json({ error: "No se pudo guardar el producto." }, { status: 500 });
  }
}
