import { NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { hashPin, PERMISSION_CATALOG, requirePermission } from "@/app/admin-auth";
import { getDb } from "@/db";
import { branches, employeePermissions, employees, rolePermissions, roles } from "@/db/schema";

export const dynamic = "force-dynamic";
type EmployeeBody = { loginName?: string; firstName?: string; lastName?: string; phone?: string; email?: string; pin?: string; roleId?: string; position?: string; branchId?: string | null; joinedAt?: string; isActive?: boolean; photoUrl?: string; payType?: string; payRate?: number | null; internalNotes?: string; permissions?: Record<string, boolean> };

async function bundle() {
  const db = getDb(); const [items, roleRows, branchRows, allRolePermissions, overrides] = await Promise.all([db.select().from(employees).orderBy(asc(employees.firstName)), db.select().from(roles).orderBy(asc(roles.name)), db.select().from(branches).orderBy(asc(branches.name)), db.select().from(rolePermissions), db.select().from(employeePermissions)]);
  return { employees: items.map((employee) => ({ ...employee, role: roleRows.find((role) => role.id === employee.roleId), branch: branchRows.find((branch) => branch.id === employee.branchId), permissionOverrides: overrides.filter((item) => item.employeeId === employee.id) })), roles: roleRows.map((role) => ({ ...role, permissions: allRolePermissions.filter((item) => item.roleId === role.id).map((item) => item.permissionCode) })), branches: branchRows, permissions: PERMISSION_CATALOG.map(([code, label, group]) => ({ code, label, group })) };
}

export async function GET() { if (!(await requirePermission("MANAGE_EMPLOYEES"))) return NextResponse.json({ error: "Sin permiso para administrar empleados." }, { status: 403 }); return NextResponse.json(await bundle()); }
export async function POST(request: Request) {
  if (!(await requirePermission("MANAGE_EMPLOYEES"))) return NextResponse.json({ error: "Sin permiso para administrar empleados." }, { status: 403 });
  const body = await request.json() as EmployeeBody; const loginName = body.loginName?.trim().toLowerCase() || ""; const firstName = body.firstName?.trim() || ""; const pin = body.pin?.trim() || "";
  if (!loginName || !firstName || !pin || pin.length < 4 || !body.roleId) return NextResponse.json({ error: "Completa usuario, nombre, rol y un PIN de al menos 4 dígitos." }, { status: 400 });
  const db = getDb(); const stamp = new Date().toISOString(); const id = crypto.randomUUID(); const hashed = await hashPin(pin);
  try { await db.batch([db.insert(employees).values({ id, loginName, firstName, lastName: body.lastName?.trim() || "", phone: body.phone?.trim() || "", email: body.email?.trim() || "", pinHash: hashed.hash, pinSalt: hashed.salt, roleId: body.roleId, position: body.position?.trim() || "", branchId: body.branchId || null, joinedAt: body.joinedAt || stamp.slice(0, 10), isActive: body.isActive !== false, photoUrl: body.photoUrl?.trim() || "", payType: body.payType?.trim() || "", payRate: Number.isFinite(Number(body.payRate)) ? Math.max(0, Math.floor(Number(body.payRate))) : null, internalNotes: body.internalNotes?.trim() || "", createdAt: stamp, updatedAt: stamp }), ...Object.entries(body.permissions || {}).map(([permissionCode, allowed]) => db.insert(employeePermissions).values({ employeeId: id, permissionCode, allowed }))]); return NextResponse.json({ ok: true, id }); } catch (error) { return NextResponse.json({ error: error instanceof Error && /unique/i.test(error.message) ? "Ese usuario ya existe." : "No se pudo guardar el empleado." }, { status: 400 }); }
}
