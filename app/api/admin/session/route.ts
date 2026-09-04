import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/admin-auth";
import { getDb } from "@/db";
import { branches } from "@/db/schema";

export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const allBranches = await getDb().select().from(branches);
  return NextResponse.json({ user, branches: allBranches });
}
