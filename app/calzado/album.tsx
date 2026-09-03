"use client";

import { useEffect, useState } from "react";

type Shoe = { id: number; category: string; title: string; caption: string; imageUrl: string };

export default function ShoeAlbum({ category }: { category: "dama" | "infantil" }) {
  const [items, setItems] = useState<Shoe[]>([]);
  useEffect(() => { fetch("/api/gallery").then((response) => response.json()).then((data) => setItems((data.items || []).filter((item: Shoe) => item.category === category))).catch(() => undefined); }, [category]);
  const title = category === "dama" ? "Calzado para dama" : "Calzado infantil";
  return <main className="shoe-album-page"><header className="site-header"><a className="brand" href="/"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></a><a className="album-back" href="/">← Inicio</a></header><section className="album-hero"><p className="eyebrow wine">COLECCIÓN RAMBER</p><h1>{title}</h1><p>{category === "dama" ? "Explora nuestros modelos para dama." : "Explora nuestros modelos para niñas y niños."}</p></section><section className="album-content">{items.length ? <div className="public-shoe-grid">{items.map((item) => <article key={item.id}><img src={item.imageUrl} alt={item.title}/><div><h2>{item.title}</h2>{item.caption && <p>{item.caption}</p>}<a href={`https://wa.me/529931520202?text=${encodeURIComponent(`Hola RAMBER, quiero información sobre ${item.title}.`)}`} target="_blank" rel="noreferrer">Pedir información</a></div></article>)}</div> : <div className="album-empty"><h2>Muy pronto</h2><p>Estamos subiendo los nuevos modelos. Regresa en unos días o escríbenos para pedir información.</p><a href="https://wa.me/529931520202" target="_blank" rel="noreferrer">Escribir por WhatsApp</a></div>}</section></main>;
}
