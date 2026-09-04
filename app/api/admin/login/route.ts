import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkCredentials, createSession, loginEmployee } from "@/app/admin-auth";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const login = body.email || ""; const secret = body.password || "";
  const owner = await checkCredentials(login, secret);
  const employee = owner ? null : await loginEmployee(login, secret);
  if (!owner && !employee) return NextResponse.json({ error: "Usuario o PIN incorrectos, o el empleado está inactivo." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSession(employee?.id), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 14 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
