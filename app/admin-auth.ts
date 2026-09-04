import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "@/db";
import { employeePermissions, employees, rolePermissions, roles } from "@/db/schema";

export const ADMIN_COOKIE = "ramber_admin";
const encoder = new TextEncoder();
export const PERMISSION_CATALOG = [
  ["VIEW_PRODUCTS", "Ver productos", "Productos"], ["CREATE_PRODUCTS", "Crear productos", "Productos"], ["EDIT_PRODUCTS", "Editar productos", "Productos"], ["VIEW_COST", "Ver costos", "Productos"], ["EDIT_PRICES", "Editar precios", "Productos"], ["APPLY_DISCOUNT", "Aplicar descuentos", "Productos"],
  ["VIEW_INVENTORY", "Ver inventario", "Inventario"], ["ADJUST_INVENTORY", "Ajustar inventario", "Inventario"], ["RECEIVE_STOCK", "Recibir mercancía", "Inventario"], ["TRANSFER_STOCK", "Transferir mercancía", "Inventario"], ["VIEW_MOVEMENTS", "Ver movimientos", "Inventario"], ["SEARCH_AVAILABILITY", "Buscar existencia", "Inventario"],
  ["VIEW_ALL_BRANCHES", "Ver todas las sucursales", "Sucursales"], ["CHANGE_BRANCH", "Cambiar sucursal", "Sucursales"], ["MANAGE_BRANCHES", "Administrar sucursales", "Sucursales"],
  ["VIEW_REPORTS", "Ver reportes", "Administración"], ["MANAGE_EMPLOYEES", "Administrar empleados", "Administración"], ["MANAGE_ROLES", "Administrar roles y permisos", "Administración"], ["OPEN_SETTINGS", "Entrar a ajustes", "Administración"],
  ["SELL", "Vender", "Próximamente"], ["QUICK_SALE", "Venta rápida", "Próximamente"], ["CANCEL_SALE", "Cancelar venta", "Próximamente"], ["CONFIGURE_PRINTER", "Configurar impresoras", "Próximamente"], ["CLOCK_IN_OUT", "Usar reloj checador", "Próximamente"],
] as const;
export type PermissionCode = typeof PERMISSION_CATALOG[number][0];
export const ALL_PERMISSIONS = PERMISSION_CATALOG.map(([code]) => code) as PermissionCode[];
type AdminEnv = typeof env & { RAMBER_ADMIN_EMAIL?: string; RAMBER_ADMIN_PASSWORD?: string; RAMBER_ADMIN_SESSION_SECRET?: string; };
type SessionData = { exp: number; userId: string };
export type CurrentUser = { id: string; name: string; role: string; roleName: string; branchId: string | null; isVirtualOwner: boolean; permissions: PermissionCode[] };

function config() { const runtime = env as AdminEnv; return { email: runtime.RAMBER_ADMIN_EMAIL?.trim().toLowerCase() || "", password: runtime.RAMBER_ADMIN_PASSWORD || "", secret: runtime.RAMBER_ADMIN_SESSION_SECRET || "" }; }
function toBase64Url(value: Uint8Array) { let binary = ""; value.forEach((byte) => { binary += String.fromCharCode(byte); }); return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); }
function fromBase64Url(value: string) { const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4); return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)); }
async function signature(value: string) { const key = await crypto.subtle.importKey("raw", encoder.encode(config().secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)))); }
function equal(left: string, right: string) { if (left.length !== right.length) return false; let result = 0; for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index); return result === 0; }
async function readSession(): Promise<SessionData | null> { const token = (await cookies()).get(ADMIN_COOKIE)?.value; if (!token || !config().secret) return null; const [payload, tokenSignature] = token.split("."); if (!payload || !tokenSignature || !equal(await signature(payload), tokenSignature)) return null; try { const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as SessionData; return typeof data.exp === "number" && data.exp > Date.now() && typeof data.userId === "string" ? data : null; } catch { return null; } }

export async function checkCredentials(email: string, password: string) { const saved = config(); return Boolean(saved.email && saved.password && saved.secret && equal(email.trim().toLowerCase(), saved.email) && equal(password, saved.password)); }
export async function hashPin(pin: string, salt = crypto.getRandomValues(new Uint8Array(16))) { const material = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]); const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, material, 256); return { hash: toBase64Url(new Uint8Array(bits)), salt: toBase64Url(salt) }; }
export async function verifyPin(pin: string, hash: string, salt: string) { return equal((await hashPin(pin, fromBase64Url(salt))).hash, hash); }
export async function loginEmployee(login: string, pin: string) { const key = login.trim().toLowerCase(); if (!key || !pin) return null; const rows = await getDb().select().from(employees).where(eq(employees.loginName, key)).limit(1); const employee = rows[0]; return employee?.isActive && await verifyPin(pin, employee.pinHash, employee.pinSalt) ? employee : null; }
export async function createSession(userId = "owner-env") { const payload = toBase64Url(encoder.encode(JSON.stringify({ userId, exp: Date.now() + 1000 * 60 * 60 * 24 * 14 }))); return `${payload}.${await signature(payload)}`; }
export async function getCurrentUser(): Promise<CurrentUser | null> { const session = await readSession(); if (!session) return null; if (session.userId === "owner-env") return { id: "owner-env", name: "Dueño RAMBER", role: "OWNER", roleName: "Dueño", branchId: null, isVirtualOwner: true, permissions: ALL_PERMISSIONS }; const db = getDb(); const rows = await db.select({ employee: employees, role: roles }).from(employees).innerJoin(roles, eq(employees.roleId, roles.id)).where(and(eq(employees.id, session.userId), eq(employees.isActive, true))).limit(1); const row = rows[0]; if (!row) return null; const [roleRows, overrides] = await Promise.all([db.select().from(rolePermissions).where(eq(rolePermissions.roleId, row.role.id)), db.select().from(employeePermissions).where(eq(employeePermissions.employeeId, row.employee.id))]); const values = new Set<string>(roleRows.map((item) => item.permissionCode)); overrides.forEach((item) => item.allowed ? values.add(item.permissionCode) : values.delete(item.permissionCode)); return { id: row.employee.id, name: `${row.employee.firstName} ${row.employee.lastName}`.trim(), role: row.role.code, roleName: row.role.name, branchId: row.employee.branchId, isVirtualOwner: false, permissions: ALL_PERMISSIONS.filter((code) => values.has(code)) }; }
export async function hasAdminSession() { return Boolean(await getCurrentUser()); }
export function hasPermission(user: CurrentUser, permission: PermissionCode) { return user.permissions.includes(permission); }
export async function requirePermission(permission: PermissionCode) { const user = await getCurrentUser(); return user && hasPermission(user, permission) ? user : null; }
export function canOperateBranch(user: CurrentUser, branchId: string) { return hasPermission(user, "VIEW_ALL_BRANCHES") || hasPermission(user, "CHANGE_BRANCH") || user.branchId === branchId; }
export const permissionLabels = Object.fromEntries(PERMISSION_CATALOG.map(([code, label, group]) => [code, { label, group }]));
