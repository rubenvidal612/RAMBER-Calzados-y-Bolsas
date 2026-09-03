"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type News = { id: number; title: string; body: string; imageUrl: string; createdAt: string };
type Settings = Record<string, string>;
const defaults: Settings = {
  heroTitle: "Encuentra la bolsa que va contigo",
  heroImage: "/images/ramber-hero.png",
  instagram: "@RAMBERCB",
  facebook: "RAMBER",
  crystal: "RAMBER Plaza Crystal · Villahermosa, Tabasco",
  americas: "RAMBER Plaza Las Américas · Villahermosa, Tabasco",
};

export default function AdminPanel() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [news, setNews] = useState<News[]>([]);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", body: "", imageUrl: "" });

  const load = async () => {
    const response = await fetch("/api/content", { cache: "no-store" });
    const data = await response.json();
    setSettings({ ...defaults, ...data.settings }); setNews(data.news || []);
  };
  useEffect(() => { void load(); }, []);
  const save = async () => {
    await Promise.all(Object.entries(settings).map(([key, value]) => fetch("/api/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) })));
    setNotice("Cambios guardados. Ya se ven en tu página.");
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>, field: "heroImage" | "news") => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setNotice("Subiendo imagen…");
    const form = new FormData(); form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", body: form }); const data = await response.json();
    setUploading(false);
    if (!response.ok) { setNotice(data.error || "No se pudo subir la imagen."); return; }
    if (field === "heroImage") setSettings((current) => ({ ...current, heroImage: data.url }));
    else setNewItem((current) => ({ ...current, imageUrl: data.url }));
    setNotice("Imagen lista. No olvides guardar o publicar la novedad.");
  };
  const publish = async (event: FormEvent) => { event.preventDefault(); const response = await fetch("/api/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newItem) }); if (!response.ok) { setNotice("No se pudo publicar."); return; } setNewItem({ title: "", body: "", imageUrl: "" }); setNotice("Novedad publicada."); await load(); };
  const remove = async (id: number) => { await fetch(`/api/content?id=${id}`, { method: "DELETE" }); await load(); };
  const set = (key: string, value: string) => setSettings((current) => ({ ...current, [key]: value }));
  const logout = async () => { await fetch("/api/admin/login", { method: "DELETE" }); window.location.href = "/"; };
  return <main className="admin-page"><header className="admin-header"><a className="brand" href="/"><span>RAMBER</span><small>ADMINISTRACIÓN</small></a><div><a href="/">Ver mi página</a><button className="admin-logout" onClick={() => void logout()}>Salir</button></div></header><section className="admin-intro"><p className="eyebrow wine">PANEL RAMBER</p><h1>Edita tu página</h1><p>Actualiza la portada, redes, sucursales y publica novedades sin mover el código.</p></section>{notice && <p className="admin-notice">{notice}</p>}
    <section className="admin-grid"><article className="admin-card"><h2>Portada</h2><label>Frase principal<input value={settings.heroTitle} onChange={(event) => set("heroTitle", event.target.value)} /></label><label>Foto principal<input type="file" accept="image/*" onChange={(event) => void upload(event, "heroImage")} /></label>{settings.heroImage && <img className="admin-preview" src={settings.heroImage} alt="Vista previa de portada"/>}<button className="admin-save" disabled={uploading} onClick={() => void save()}>Guardar portada</button></article>
      <article className="admin-card"><h2>Pie de página y sucursales</h2><label>Instagram<input value={settings.instagram} onChange={(event) => set("instagram", event.target.value)} /></label><label>Facebook<input value={settings.facebook} onChange={(event) => set("facebook", event.target.value)} /></label><label>Plaza Crystal<input value={settings.crystal} onChange={(event) => set("crystal", event.target.value)} /></label><label>Plaza Las Américas<input value={settings.americas} onChange={(event) => set("americas", event.target.value)} /></label><button className="admin-save" onClick={() => void save()}>Guardar información</button></article>
      <article className="admin-card admin-wide"><h2>Publicar una novedad</h2><form onSubmit={(event) => void publish(event)}><label>Título<input required value={newItem.title} onChange={(event) => setNewItem({ ...newItem, title: event.target.value })} placeholder="Ej. Nuevos modelos disponibles"/></label><label>Texto corto<textarea value={newItem.body} onChange={(event) => setNewItem({ ...newItem, body: event.target.value })} placeholder="Describe la novedad o promoción"/></label><label>Foto<input type="file" accept="image/*" onChange={(event) => void upload(event, "news")} /></label>{newItem.imageUrl && <img className="admin-preview news-preview" src={newItem.imageUrl} alt="Vista previa de novedad"/>}<button className="admin-save" disabled={uploading}>Publicar en inicio</button></form></article>
    </section><section className="admin-list"><h2>Novedades publicadas</h2>{news.length ? news.map((item) => <article key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt=""/>}<div><strong>{item.title}</strong><p>{item.body}</p></div><button onClick={() => void remove(item.id)}>Eliminar</button></article>) : <p>Aún no has publicado novedades.</p>}</section></main>;
}
