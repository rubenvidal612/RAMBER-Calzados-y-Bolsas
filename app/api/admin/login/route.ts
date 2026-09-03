import { NextResponse } from "next/server";
import { ADMIN_COOKIE, checkCredentials, createSession } from "@/app/admin-auth";

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  if (!(await checkCredentials(body.email || "", body.password || ""))) return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createSession(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 14 });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
