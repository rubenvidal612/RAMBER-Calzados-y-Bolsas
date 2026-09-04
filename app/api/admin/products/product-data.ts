export type ProductSizeInput = { size?: string; quantity?: number };
export type ProductPayload = {
  category?: "dama" | "infantil"; model?: string; sku?: string; name?: string; description?: string; color?: string;
  costPrice?: number; publicPrice?: number; inOffer?: boolean; discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null; primaryImageUrl?: string; imageUrls?: string[]; sizes?: ProductSizeInput[];
  primaryImageZoom?: number; primaryImageX?: number; primaryImageY?: number;
};

export type CleanProduct = {
  category: "dama" | "infantil"; model: string; sku: string | null; name: string; description: string; color: string;
  costPrice: number; publicPrice: number; promoPrice: number | null; inOffer: boolean;
  discountType: "percentage" | "fixed" | null; discountValue: number | null; primaryImageUrl: string;
  imageUrls: string[]; sizes: Array<{ size: string; quantity: number }>;
  primaryImageZoom: number; primaryImageX: number; primaryImageY: number;
};

export function cleanProduct(body: ProductPayload): CleanProduct | null {
  const suppliedModel = body.model?.trim() || "";
  const name = body.name?.trim() || suppliedModel;
  const model = suppliedModel || name;
  const sizes = Array.from(new Map((body.sizes || []).map((item) => [String(item.size || "").trim(), Number(item.quantity)])).entries())
    .filter(([size]) => Boolean(size)).map(([size, quantity]) => ({ size, quantity }));
  const imageUrls = Array.from(new Set((body.imageUrls || []).map(String).filter(Boolean)));
  const costPrice = Number(body.costPrice ?? 0); const publicPrice = Number(body.publicPrice);
  const primaryImageZoom = Math.round(Number(body.primaryImageZoom ?? 100));
  const primaryImageX = Math.round(Number(body.primaryImageX ?? 50));
  const primaryImageY = Math.round(Number(body.primaryImageY ?? 50));
  if (!body.category || !["dama", "infantil"].includes(body.category) || !name || !model || !body.color?.trim() || !Number.isInteger(costPrice) || costPrice < 0 || !Number.isInteger(publicPrice) || publicPrice < 0 || !sizes.length || sizes.some((item) => !Number.isInteger(item.quantity) || item.quantity < 0) || !body.primaryImageUrl || !imageUrls.length || primaryImageZoom < 100 || primaryImageZoom > 300 || primaryImageX < 0 || primaryImageX > 100 || primaryImageY < 0 || primaryImageY > 100) return null;
  const inOffer = Boolean(body.inOffer);
  let discountType: "percentage" | "fixed" | null = null; let discountValue: number | null = null; let promoPrice: number | null = null;
  if (inOffer) {
    if (body.discountType !== "percentage" && body.discountType !== "fixed") return null;
    const value = Number(body.discountValue);
    if (!Number.isInteger(value) || value < 0 || (body.discountType === "percentage" && value > 100) || (body.discountType === "fixed" && value > publicPrice)) return null;
    discountType = body.discountType; discountValue = value;
    promoPrice = body.discountType === "percentage" ? Math.round(publicPrice * (100 - value) / 100) : Math.max(0, publicPrice - value);
  }
  return { category: body.category, model, sku: body.sku?.trim() || null, name, description: body.description?.trim() || "", color: body.color.trim(), costPrice, publicPrice, promoPrice, inOffer, discountType, discountValue, primaryImageUrl: body.primaryImageUrl, imageUrls, sizes, primaryImageZoom, primaryImageX, primaryImageY };
}
