import { cookies } from "next/headers";
import { env } from "cloudflare:workers";

export const ADMIN_COOKIE = "ramber_admin";
const encoder = new TextEncoder();

type AdminEnv = typeof env & {
  RAMBER_ADMIN_EMAIL?: string;
  RAMBER_ADMIN_PASSWORD?: string;
  RAMBER_ADMIN_SESSION_SECRET?: string;
};

function config() {
  const runtime = env as AdminEnv;
  return {
    email: runtime.RAMBER_ADMIN_EMAIL?.trim().toLowerCase() || "",
    password: runtime.RAMBER_ADMIN_PASSWORD || "",
    secret: runtime.RAMBER_ADMIN_SESSION_SECRET || "",
  };
}

function toBase64Url(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signature(value: string) {
  const { secret } = config();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

export async function checkCredentials(email: string, password: string) {
  const saved = config();
  return Boolean(saved.email && saved.password && saved.secret && equal(email.trim().toLowerCase(), saved.email) && equal(password, saved.password));
}

export async function createSession() {
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 14;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: expires })));
  return `${payload}.${await signature(payload)}`;
}

export async function hasAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || !config().secret) return false;
  const [payload, tokenSignature] = token.split(".");
  if (!payload || !tokenSignature || !equal(await signature(payload), tokenSignature)) return false;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch { return false; }
}
