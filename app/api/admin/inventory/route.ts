import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { branchStock, branches, inventoryMovements, inventoryTransfers, shoeProductVariants, shoeProducts } from "@/db/schema";

export const dynamic = "force-dynamic";
async function isAdmin() { const { hasAdminSession } = await import("@/app/admin-auth"); return hasAdminSession(); }
const now = () => new Date().toISOString();
type Action = { action?: "entry" | "adjustment" | "transfer"; productId?: number; variantId?: number; size?: string; branchId?: string; originBranchId?: string; destinationBranchId?: string; quantity?: number; reason?: string };

export async function GET(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const db = getDb(); const params = new URL(request.url).searchParams; const q = (params.get("q") || "").trim().toLowerCase();
  const [allBranches, products, variants, stocks, movements] = await Promise.all([
    db.select().from(branches).orderBy(asc(branches.name)), db.select().from(shoeProducts).orderBy(desc(shoeProducts.id)), db.select().from(shoeProductVariants), db.select().from(branchStock), db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(250),
  ]);
  const inventory = stocks.map((stock) => { const variant = variants.find((item) => item.id === stock.variantId); const product = products.find((item) => item.id === variant?.productId); return { ...stock, variant, product, branch: allBranches.find((branch) => branch.id === stock.branchId) }; }).filter((item) => item.product && item.variant && (!q || [item.product?.model, item.product?.sku, item.product?.name, item.variant?.color, item.size].filter(Boolean).join(" ").toLowerCase().includes(q)));
  const visibleMovements = movements.map((movement) => { const variant = variants.find((item) => item.id === movement.variantId); return { ...movement, product: products.find((item) => item.id === movement.productId), variant, branch: allBranches.find((branch) => branch.id === movement.branchId) }; });
  return NextResponse.json({ branches: allBranches, products, variants, inventory, movements: visibleMovements });
}

async function stockAt(variantId: number, size: string, branchId: string) { const rows = await getDb().select().from(branchStock).where(and(eq(branchStock.variantId, variantId), eq(branchStock.size, size), eq(branchStock.branchId, branchId))).limit(1); return rows[0] || null; }

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json() as Action;
  const quantity = Math.floor(Number(body.quantity));
  if (!body.action || !body.productId || !body.variantId || !body.size || !Number.isInteger(quantity) || quantity <= 0) return NextResponse.json({ error: "Completa producto, color, talla y cantidad." }, { status: 400 });
  const db = getDb(); const stamp = now();
  if (body.action === "transfer") {
    if (!body.originBranchId || !body.destinationBranchId || body.originBranchId === body.destinationBranchId) return NextResponse.json({ error: "Elige dos sucursales diferentes." }, { status: 400 });
    const origin = await stockAt(body.variantId, body.size, body.originBranchId); const destination = await stockAt(body.variantId, body.size, body.destinationBranchId);
    if (!origin || origin.quantity < quantity) return NextResponse.json({ error: "No hay suficientes pares en la sucursal origen." }, { status: 400 });
    const transferId = crypto.randomUUID(); const destinationBefore = destination?.quantity || 0;
    await db.batch([
      db.update(branchStock).set({ quantity: origin.quantity - quantity, updatedAt: stamp }).where(eq(branchStock.id, origin.id)),
      destination ? db.update(branchStock).set({ quantity: destinationBefore + quantity, updatedAt: stamp }).where(eq(branchStock.id, destination.id)) : db.insert(branchStock).values({ variantId: body.variantId, size: body.size, branchId: body.destinationBranchId, quantity, updatedAt: stamp }),
      db.insert(inventoryTransfers).values({ id: transferId, originBranchId: body.originBranchId, destinationBranchId: body.destinationBranchId, createdAt: stamp, note: body.reason || "" }),
      db.insert(inventoryMovements).values({ id: crypto.randomUUID(), productId: body.productId, variantId: body.variantId, size: body.size, branchId: body.originBranchId, type: "TRANSFER_OUT", quantityDelta: -quantity, quantityBefore: origin.quantity, quantityAfter: origin.quantity - quantity, reason: body.reason || "Transferencia", referenceId: transferId, createdAt: stamp }),
      db.insert(inventoryMovements).values({ id: crypto.randomUUID(), productId: body.productId, variantId: body.variantId, size: body.size, branchId: body.destinationBranchId, type: "TRANSFER_IN", quantityDelta: quantity, quantityBefore: destinationBefore, quantityAfter: destinationBefore + quantity, reason: body.reason || "Transferencia", referenceId: transferId, createdAt: stamp }),
    ]);
    return NextResponse.json({ ok: true, transferId });
  }
  if (!body.branchId) return NextResponse.json({ error: "Elige una sucursal." }, { status: 400 });
  const before = await stockAt(body.variantId, body.size, body.branchId); const delta = body.action === "entry" ? quantity : Number(body.reason?.startsWith("-") ? -quantity : quantity);
  if (body.action === "adjustment" && !body.reason?.trim()) return NextResponse.json({ error: "Indica el motivo del ajuste." }, { status: 400 });
  if ((before?.quantity || 0) + delta < 0) return NextResponse.json({ error: "El ajuste dejaría el inventario en negativo." }, { status: 400 });
  const after = (before?.quantity || 0) + delta;
  await db.batch([
    before ? db.update(branchStock).set({ quantity: after, updatedAt: stamp }).where(eq(branchStock.id, before.id)) : db.insert(branchStock).values({ variantId: body.variantId, size: body.size, branchId: body.branchId, quantity: after, updatedAt: stamp }),
    db.insert(inventoryMovements).values({ id: crypto.randomUUID(), productId: body.productId, variantId: body.variantId, size: body.size, branchId: body.branchId, type: body.action === "entry" ? "PURCHASE/ENTRY" : delta >= 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT", quantityDelta: delta, quantityBefore: before?.quantity || 0, quantityAfter: after, reason: body.reason || "Entrada de mercancía", createdAt: stamp }),
  ]);
  return NextResponse.json({ ok: true });
}
