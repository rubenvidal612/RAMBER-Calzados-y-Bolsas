"use client";

import { useEffect, useMemo, useState } from "react";
import { catalogProducts, type CatalogProduct } from "../catalog-products";
import { catalogProducts2 } from "../catalog-products-2";

const WHATSAPP = "529931520202";
type CartItem = CatalogProduct & { quantity: number };
const whatsappUrl = (message: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

export default function BagsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState("Todas");
  const [visibleCount, setVisibleCount] = useState(24);
  const [cartReady, setCartReady] = useState(false);
  const [catalogId, setCatalogId] = useState("1");
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartWhatsAppUrl = cart.length ? whatsappUrl([
    "Hola RAMBER, quiero solicitar una cotización:", "",
    ...cart.map((item) => `• ${item.family} · Modelo ${item.code} · ${item.color} · ${item.quantity} pieza${item.quantity > 1 ? "s" : ""}`),
    "", `Total de piezas: ${cartCount}`,
  ].join("\n")) : "#";
  const activeProducts = catalogId === "2" ? catalogProducts2 : catalogProducts;
  const catalogFamilies = useMemo(() => Array.from(new Set(activeProducts.map((product) => product.family))), [activeProducts]);
  const productGroups = useMemo(() => catalogFamilies.map((family) => ({
    family,
    variants: activeProducts.filter((product) => product.family === family),
  })), [activeProducts, catalogFamilies]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es");
    return productGroups.flatMap((group) => {
      const matchesFamily = familyFilter === "Todas" || group.family === familyFilter;
      const matchesSearch = !term || group.variants.some((product) => `${product.code} ${product.family} ${product.color}`.toLocaleLowerCase("es").includes(term));
      if (!matchesFamily || !matchesSearch) return [];
      const exactColor = group.variants.find((product) => product.color.toLocaleLowerCase("es") === term);
      const matchingVariant = term
        ? exactColor || group.variants.find((product) => `${product.code} ${product.family} ${product.color}`.toLocaleLowerCase("es").includes(term))
        : undefined;
      return [{ ...group, displayVariant: matchingVariant || group.variants[0] }];
    });
  }, [search, familyFilter, productGroups]);

  useEffect(() => {
    const requestedCatalog = new URLSearchParams(window.location.search).get("catalogo");
    if (requestedCatalog === "2") setCatalogId("2");
  }, []);

  const changeCatalog = (nextCatalog: string) => {
    setCatalogId(nextCatalog);
    setSearch("");
    setFamilyFilter("Todas");
    setVisibleCount(24);
    const url = nextCatalog === "2" ? "/bolsas?catalogo=2" : "/bolsas";
    window.history.replaceState({}, "", url);
  };
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [filteredGroups, visibleCount]);

  useEffect(() => {
    document.body.style.overflow = cartOpen || menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [cartOpen, menuOpen]);

  useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem("ramber-quote-cart") || "[]")); } catch { setCart([]); }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (cartReady) localStorage.setItem("ramber-quote-cart", JSON.stringify(cart));
  }, [cart, cartReady]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addProductToCart = (product: CatalogProduct) => {
    setCart((current) => {
      const existing = current.find((item) => item.code === product.code);
      if (existing) return current.map((item) => item.code === product.code ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setToast(`Modelo ${product.code} agregado a tu cotización`);
  };

  const changeCartQuantity = (code: string, amount: number) => setCart((current) => current
    .map((item) => item.code === code ? { ...item, quantity: item.quantity + amount } : item)
    .filter((item) => item.quantity > 0));

  return <main>
    <header className="site-header">
      <a className="brand" href="/"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></a>
      <div className="header-actions"><a className="contact-link" href="/">Inicio</a><button className="header-cart" onClick={() => setCartOpen(true)}>Cotización{cartCount > 0 && <span>{cartCount}</span>}</button><button className="menu-button" onClick={() => setMenuOpen(true)}>Menú</button></div>
    </header>
    <div className={`menu-overlay ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
      <button className="close-menu" onClick={() => setMenuOpen(false)}>Cerrar</button>
      <nav><a href="/">Inicio</a><a href="/bolsas">Bolsas</a><a href="/#catalogos">Catálogos</a><a href="/#pedidos">Pedidos</a><a href={whatsappUrl("Hola RAMBER, quiero más información.")} target="_blank" rel="noreferrer">Contacto</a></nav>
      <p>Elige tus modelos y colores.</p>
    </div>

    <section className="bags-page-hero">
      <p className="eyebrow wine">CATÁLOGO 1 COMPLETO</p><h1>Bolsas</h1><p>Explora todos nuestros modelos, elige colores y agrega las piezas que quieras a tu cotización.</p>
      <button onClick={() => setCartOpen(true)}>Ver mi cotización {cartCount > 0 && `(${cartCount})`}</button>
    </section>

    <section className="catalog-shop-section bags-route-catalog">
      <div className="catalog-switcher reveal" aria-label="Elegir catálogo"><button className={catalogId === "1" ? "active" : ""} onClick={() => changeCatalog("1")}><small>COLECCIÓN</small>Catálogo 1<span>{catalogProducts.length} productos</span></button><button className={catalogId === "2" ? "active" : ""} onClick={() => changeCatalog("2")}><small>NUEVA COLECCIÓN</small>Catálogo 2<span>{catalogProducts2.length} productos</span></button></div>
      <div className="catalog-shop-heading reveal"><div><p className="eyebrow wine">CATÁLOGO {catalogId} · TODAS LAS COLECCIONES</p><h2>Elige un modelo</h2><p>{productGroups.length} modelos y {activeProducts.length} productos disponibles, sin precios.</p></div><span>{filteredGroups.length} modelos</span></div>
      <div className="catalog-toolbar reveal">
        <label>Buscar modelo o color<input value={search} onChange={(event) => {setSearch(event.target.value);setVisibleCount(24);}} placeholder="Ej. 4125, negro o Aurora"/></label>
        <label>Colección<select value={familyFilter} onChange={(event) => {setFamilyFilter(event.target.value);setVisibleCount(24);}}><option>Todas</option>{catalogFamilies.map((family) => <option key={family}>{family}</option>)}</select></label>
      </div>
      <div className="catalog-product-grid family-product-grid">{filteredGroups.slice(0,visibleCount).map((group,index) => <a className="catalog-product-card family-product-card reveal" style={{transitionDelay:`${Math.min(index%8,4)*45}ms`}} key={group.family} href={`/bolsa?catalogo=${catalogId}&modelo=${encodeURIComponent(group.family)}&codigo=${group.displayVariant.code}`}>
        <img src={group.displayVariant.image} loading="lazy" alt={`Bolsa ${group.family} color ${group.displayVariant.color}`}/>
        <div className="catalog-product-info"><p>MODELO</p><h3>{group.family}</h3><strong>{search.trim() ? `${group.displayVariant.color} · Modelo ${group.displayVariant.code}` : `${group.variants.length} colores disponibles`}</strong><span>{group.displayVariant.measurements}</span><span className="view-colors-button">Ver todos los colores</span></div>
      </a>)}</div>
      {!filteredGroups.length && <div className="no-results"><h3>No encontramos ese modelo</h3><p>Prueba con otro número, color o colección.</p></div>}
      {visibleCount < filteredGroups.length && <button className="load-more-button" onClick={() => setVisibleCount((count) => count + 24)}>Ver más modelos</button>}
    </section>

    <footer><div className="footer-brand"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></div><p>Arma tu pedido sin compromiso.</p><a href={whatsappUrl("Hola RAMBER, quiero más información.")} target="_blank" rel="noreferrer">WhatsApp 993 152 0202</a></footer>
    <div className={`cart-backdrop ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
    <aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen} aria-label="Tu cotización">
      <div className="cart-heading"><div><p>RAMBER</p><h2>Tu cotización ({cartCount})</h2></div><button onClick={() => setCartOpen(false)}>Cerrar</button></div>
      <div className="cart-items">{cart.length ? cart.map((item) => <article key={item.code}><img src={item.image} alt={`Modelo ${item.code} ${item.color}`}/><div><strong>{item.family}</strong><span>Modelo {item.code} · {item.color}</span><div className="cart-quantity"><button onClick={() => changeCartQuantity(item.code,-1)}>−</button><b>{item.quantity}</b><button onClick={() => changeCartQuantity(item.code,1)}>+</button></div></div></article>) : <div className="empty-cart"><p>Tu cotización está vacía.</p><span>Elige uno o varios modelos y agrégalos aquí.</span></div>}</div>
      <a className={`send-cart-button ${!cart.length ? "disabled" : ""}`} href={cartWhatsAppUrl} target="_blank" rel="noopener noreferrer" aria-disabled={!cart.length} onClick={(event) => { if (!cart.length) event.preventDefault(); }}>Enviar por WhatsApp</a>
    </aside>
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
