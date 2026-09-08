import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { bagProducts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const catalog = new URL(request.url).searchParams.get("catalog");
  try {
    const db = getDb();
    const rows = await db.select().from(bagProducts).where(eq(bagProducts.isActive, true)).orderBy(asc(bagProducts.catalog), asc(bagProducts.code));
    const filtered = catalog === "2" ? rows.filter((item) => item.catalog === "2") : catalog === "1" ? rows.filter((item) => item.catalog === "1") : rows;
    return NextResponse.json({ items: filtered.map(({ id, catalog, code, family, color, measurements, features, image }) => ({ id, catalog, code, family, color, measurements, features, image })) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
