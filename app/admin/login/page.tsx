"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    setLoading(false);
    if (!response.ok) { setError("Revisa tu usuario y contraseña o PIN."); return; }
    window.location.href = "/admin";
  };
  return <main className="admin-login"><form onSubmit={submit}><a className="brand" href="/"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></a><p className="eyebrow wine">ACCESO PRIVADO</p><h1>Administración</h1><p>El dueño entra con correo y contraseña. Los empleados entran con su usuario y PIN.</p><label>Correo o usuario<input required type="text" name="email" autoComplete="username" placeholder="Tu correo o usuario" /></label><label>Contraseña o PIN<input required type="password" name="password" autoComplete="current-password" /></label>{error && <span className="login-error">{error}</span>}<button disabled={loading}>{loading ? "Entrando…" : "Entrar al Admin"}</button><a className="login-back" href="/">← Volver a RAMBER</a></form></main>;
}
