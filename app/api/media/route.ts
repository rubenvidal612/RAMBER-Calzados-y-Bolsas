import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key");
  if (!key || key.includes("..")) return new NextResponse("No encontrado", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new NextResponse("No encontrado", { status: 404 });
  return new NextResponse(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType || "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
}

export async function POST(request: Request) {
  const { hasAdminSession } = await import("@/app/admin-auth");
  if (!(await hasAdminSession())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Usa una imagen de máximo 8 MB" }, { status: 400 });
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "jpg";
  const key = `admin/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return NextResponse.json({ url: `/api/media?key=${encodeURIComponent(key)}` });
}
