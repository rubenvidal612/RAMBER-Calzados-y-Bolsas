import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { branchStock, inventoryMovements, shoeProductImages, shoeProductVariants, shoeProducts, shoeProductSizes } from "@/db/schema";
import { cleanProduct, type ProductPayload } from "../product-data";

export const dynamic = "force-dynamic";
async function isAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }
function idOf(request: Request) { const value = Number(new URL(request.url).pathname.split("/").pop()); return Number.isInteger(value) ? value : null; }

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = idOf(request); const body = await request.json() as ProductPayload & { isActive?: boolean }; const data = cleanProduct(body);
  if (!id || !data) return NextResponse.json({ error: "Completa los datos obligatorios y revisa el descuento." }, { status: 400 });
  const db = getDb();
  try {
    const [variant] = await db.select().from(shoeProductVariants).where(eq(shoeProductVariants.productId, id)).limit(1);
    if (!variant) throw new Error("Variante no encontrada");
    const oldStocks = await db.select().from(branchStock).where(eq(branchStock.variantId, variant.id));
    const now = new Date().toISOString();
    const sizeTotals = new Map(data.sizes.map((size) => [size.size, data.branchStocks.filter((stock) => stock.size === size.size).reduce((sum, stock) => sum + stock.quantity, 0)]));
    const movementRows = data.branchStocks.flatMap((stock) => { const before = oldStocks.find((item) => item.size === stock.size && item.branchId === stock.branchId)?.quantity || 0; const delta = stock.quantity - before; return delta ? [db.insert(inventoryMovements).values({ id: crypto.randomUUID(), productId: id, variantId: variant.id, size: stock.size, branchId: stock.branchId, type: delta > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT", quantityDelta: delta, quantityBefore: before, quantityAfter: stock.quantity, reason: "Edición de existencias del producto", createdAt: now })] : []; });
    await db.batch([
      db.update(shoeProducts).set({ category: data.category, model: data.model, sku: data.sku, name: data.name, description: data.description, color: data.color, costPrice: data.costPrice, publicPrice: data.publicPrice, promoPrice: data.promoPrice, inOffer: data.inOffer, discountType: data.discountType, discountValue: data.discountValue, isActive: body.isActive !== false, primaryImageUrl: data.primaryImageUrl, primaryImageZoom: data.primaryImageZoom, primaryImageX: data.primaryImageX, primaryImageY: data.primaryImageY, updatedAt: new Date().toISOString() }).where(eq(shoeProducts.id, id)),
      db.update(shoeProductVariants).set({ color: data.color, updatedAt: now }).where(eq(shoeProductVariants.id, variant.id)),
      db.delete(branchStock).where(eq(branchStock.variantId, variant.id)),
      db.delete(shoeProductSizes).where(eq(shoeProductSizes.productId, id)),
      db.delete(shoeProductImages).where(eq(shoeProductImages.productId, id)),
      ...data.sizes.map((size) => db.insert(shoeProductSizes).values({ productId: id, size: size.size, quantity: sizeTotals.get(size.size) || 0 })),
      ...data.branchStocks.map((stock) => db.insert(branchStock).values({ variantId: variant.id, size: stock.size, branchId: stock.branchId, quantity: stock.quantity, updatedAt: now })),
      ...movementRows,
      ...data.imageUrls.map((imageUrl, index) => db.insert(shoeProductImages).values({ productId: id, imageUrl, sortOrder: index })),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) { const message = error instanceof Error ? error.message : ""; return NextResponse.json({ error: /unique/i.test(message) ? "Modelo o SKU duplicado." : "No se pudo actualizar." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = idOf(request); if (!id) return NextResponse.json({ error: "Producto inválido" }, { status: 400 });
  await getDb().update(shoeProducts).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(shoeProducts.id, id));
  return NextResponse.json({ ok: true });
}
