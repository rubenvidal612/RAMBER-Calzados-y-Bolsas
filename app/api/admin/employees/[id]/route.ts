import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { hashPin, requirePermission } from "@/app/admin-auth";
import { getDb } from "@/db";
import { employeePermissions, employees } from "@/db/schema";
export const dynamic = "force-dynamic";
function idOf(request: Request) { return new URL(request.url).pathname.split("/").pop() || ""; }
export async function PUT(request: Request) {
  if (!(await requirePermission("MANAGE_EMPLOYEES"))) return NextResponse.json({ error: "Sin permiso para administrar empleados." }, { status: 403 });
  const id = idOf(request); const body = await request.json() as Record<string, unknown>; if (!id) return NextResponse.json({ error: "Empleado inválido" }, { status: 400 });
  const db = getDb(); const stamp = new Date().toISOString(); const update: Record<string, unknown> = { updatedAt: stamp };
  for (const [source, target] of [["loginName","loginName"],["firstName","firstName"],["lastName","lastName"],["phone","phone"],["email","email"],["roleId","roleId"],["position","position"],["branchId","branchId"],["joinedAt","joinedAt"],["isActive","isActive"],["photoUrl","photoUrl"],["payType","payType"],["payRate","payRate"],["internalNotes","internalNotes"]] as const) if (source in body) update[target] = typeof body[source] === "string" ? body[source].trim() : body[source];
  if (typeof body.pin === "string" && body.pin.trim()) { if (body.pin.trim().length < 4) return NextResponse.json({ error: "El PIN debe tener al menos 4 dígitos." }, { status: 400 }); const hashed = await hashPin(body.pin.trim()); update.pinHash = hashed.hash; update.pinSalt = hashed.salt; }
  try { const batch = [db.update(employees).set(update).where(eq(employees.id, id))]; if (body.permissions && typeof body.permissions === "object") { batch.push(db.delete(employeePermissions).where(eq(employeePermissions.employeeId, id))); for (const [permissionCode, allowed] of Object.entries(body.permissions as Record<string, boolean>)) batch.push(db.insert(employeePermissions).values({ employeeId: id, permissionCode, allowed: Boolean(allowed) })); } await db.batch(batch); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "No se pudo actualizar el empleado." }, { status: 400 }); }
}
