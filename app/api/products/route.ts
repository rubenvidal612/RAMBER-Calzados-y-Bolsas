import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { shoeProductImages, shoeProducts, shoeProductSizes } from "@/db/schema";

export const dynamic = "force-dynamic";

export type PublicShoeProduct = {
  id: number; category: "dama" | "infantil"; model: string; name: string; description: string; color: string;
  publicPrice: number; promoPrice: number | null; inOffer: boolean; primaryImageUrl: string; primaryImageZoom: number; primaryImageX: number; primaryImageY: number; sizes: Array<{ size: string; available: boolean }>; images: string[];
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
    const [sizes, images] = ids.length ? await Promise.all([
      db.select().from(shoeProductSizes).where(inArray(shoeProductSizes.productId, ids)).orderBy(asc(shoeProductSizes.size)),
      db.select().from(shoeProductImages).where(inArray(shoeProductImages.productId, ids)).orderBy(asc(shoeProductImages.sortOrder)),
    ]) : [[], []];
    return NextResponse.json({ items: products.map((product) => ({
      id: product.id, category: product.category, model: product.model, name: product.name, description: product.description,
      color: product.color, publicPrice: product.publicPrice, promoPrice: product.promoPrice, inOffer: product.inOffer,
      primaryImageUrl: product.primaryImageUrl, primaryImageZoom: product.primaryImageZoom, primaryImageX: product.primaryImageX, primaryImageY: product.primaryImageY,
      sizes: sizes.filter((size) => size.productId === product.id).map((size) => ({ size: size.size, available: size.quantity > 0 })),
      images: images.filter((image) => image.productId === product.id).map((image) => image.imageUrl),
    })) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
