"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = "dama" | "infantil";
type Product = { id: number; category: Category; model: string; name: string; description: string; color: string; publicPrice: number; promoPrice: number | null; inOffer: boolean; primaryImageUrl: string; primaryImageZoom: number; primaryImageX: number; primaryImageY: number; sizes: Array<{ size: string; available: boolean }>; images: string[] };
const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(value);

export default function ShoeDetail({ category, id }: { category: Category; id: number }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [photo, setPhoto] = useState("");
  const [size, setSize] = useState("");
  useEffect(() => { fetch(`/api/products?category=${category}`, { cache: "no-store" }).then((response) => response.json()).then((data) => { const found = (data.items || []).find((item: Product) => item.id === id); setProduct(found || null); setPhoto(found?.primaryImageUrl || ""); }).catch(() => undefined); }, [category, id]);
  if (!product) return <main className="detail-loading">Cargando modelo…</main>;
  const finalPrice = product.inOffer && product.promoPrice !== null ? product.promoPrice : product.publicPrice;
  const catalogHref = category === "dama" ? "/calzado-dama" : "/calzado-infantil";
  const showingCover = (photo || product.primaryImageUrl) === product.primaryImageUrl;
  const text = `Hola RAMBER, quiero información sobre ${product.name}, modelo ${product.model}, color ${product.color}${size ? `, número ${size}` : ""}.`;
  return <main className="shoe-detail-page"><header className="site-header"><Link className="brand" href="/"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></Link><Link className="album-back" href={catalogHref}>← Catálogo</Link></header><section className="shoe-detail-shell"><Link className="detail-return" href={catalogHref}>← <span>Volver al catálogo</span></Link><div className="shoe-detail-layout"><div><div className="shoe-detail-image"><img src={photo || product.primaryImageUrl} alt={product.name} style={showingCover ? { transform: `scale(${(product.primaryImageZoom ?? 100) / 100})`, transformOrigin: `${product.primaryImageX ?? 50}% ${product.primaryImageY ?? 50}%` } : undefined}/></div><div className="shoe-thumbnails">{Array.from(new Set([product.primaryImageUrl, ...product.images])).map((image) => <button className={photo === image ? "selected" : ""} onClick={() => setPhoto(image)} key={image}><img src={image} alt="Otra vista"/></button>)}</div></div><article className="shoe-detail-info"><p className="eyebrow wine">{category === "dama" ? "CALZADO DAMA" : "CALZADO INFANTIL"}</p><p className="shoe-model">MODELO {product.model}</p><h1>{product.name}</h1><p className="shoe-color">Color: <strong>{product.color}</strong></p>{product.description && <p className="shoe-description">{product.description}</p>}<div className="shoe-price">{product.inOffer && product.promoPrice !== null && <del>{money(product.publicPrice)}</del>}<strong>{money(finalPrice)}</strong>{product.inOffer && <span>Precio especial</span>}</div><div className="shoe-size-select"><h2>Selecciona tu número</h2><div>{product.sizes.map((item) => <button disabled={!item.available} className={`${size === item.size ? "selected" : ""} ${!item.available ? "sold-out" : ""}`} onClick={() => item.available && setSize(item.size)} key={item.size}>{item.size}</button>)}</div></div><p className="shoe-stock-note">Los números agotados se muestran desactivados. Consulta disponibilidad en nuestras sucursales.</p><a className="shoe-whatsapp" target="_blank" rel="noreferrer" href={`https://wa.me/529931520202?text=${encodeURIComponent(text)}`}>Pedir por WhatsApp</a></article></div></section></main>;
}
