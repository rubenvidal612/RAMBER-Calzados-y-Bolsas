import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { branchStock, branches, shoeProductImages, shoeProductVariants, shoeProducts } from "@/db/schema";

export const dynamic = "force-dynamic";

export type PublicShoeProduct = {
  id: number; category: "dama" | "infantil"; model: string; name: string; description: string; color: string;
  publicPrice: number; promoPrice: number | null; inOffer: boolean; primaryImageUrl: string; primaryImageZoom: number; primaryImageX: number; primaryImageY: number; sizes: Array<{ size: string; available: boolean; branches: string[] }>; images: string[];
  variants: Array<{ id: number; color: string; sizes: Array<{ size: string; available: boolean; branches: string[] }> }>;
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const category = params.get("category");
  const offers = params.get("offers") === "1";
  if (category && !["dama", "infantil"].includes(category)) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  try {
    const db = getDb();
    const conditions = [eq(shoeProducts.isActive, true)];
    if (category) conditions.push(eq(shoeProducts.category, category));
    if (offers) conditions.push(eq(shoeProducts.inOffer, true));
    const products = await db.select().from(shoeProducts).where(and(...conditions)).orderBy(desc(shoeProducts.id));
    const ids = products.map((product) => product.id);
    const [variants, stocks, images, activeBranches] = ids.length ? await Promise.all([
      db.select().from(shoeProductVariants).where(inArray(shoeProductVariants.productId, ids)),
      db.select().from(branchStock),
      db.select().from(shoeProductImages).where(inArray(shoeProductImages.productId, ids)).orderBy(asc(shoeProductImages.sortOrder)),
      db.select().from(branches).where(eq(branches.isActive, true)),
    ]) : [[], [], [], []];
    return NextResponse.json({ items: products.map((product) => ({
      id: product.id, category: product.category, model: product.model, name: product.name, description: product.description,
      color: product.color, publicPrice: product.publicPrice, promoPrice: product.promoPrice, inOffer: product.inOffer,
      primaryImageUrl: product.primaryImageUrl, primaryImageZoom: product.primaryImageZoom, primaryImageX: product.primaryImageX, primaryImageY: product.primaryImageY,
      variants: variants.filter((variant) => variant.productId === product.id).map((variant) => {
        const rows = stocks.filter((stock) => stock.variantId === variant.id);
        const sizes = Array.from(new Set(rows.map((row) => row.size))).sort((a, b) => Number(a) - Number(b)).map((size) => {
          const sizeRows = rows.filter((row) => row.size === size);
          return { size, available: sizeRows.some((row) => row.quantity > 0), branches: sizeRows.filter((row) => row.quantity > 0).map((row) => activeBranches.find((branch) => branch.id === row.branchId)?.shortName || row.branchId) };
        });
        return { id: variant.id, color: variant.color, sizes };
      }),
      sizes: (() => { const rows = stocks.filter((stock) => variants.some((variant) => variant.productId === product.id && variant.id === stock.variantId)); return Array.from(new Set(rows.map((row) => row.size))).sort((a, b) => Number(a) - Number(b)).map((size) => ({ size, available: rows.some((row) => row.size === size && row.quantity > 0), branches: rows.filter((row) => row.size === size && row.quantity > 0).map((row) => activeBranches.find((branch) => branch.id === row.branchId)?.shortName || row.branchId) })); })(),
      images: images.filter((image) => image.productId === product.id).map((image) => image.imageUrl),
    })) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
