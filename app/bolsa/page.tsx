"use client";

import { useEffect, useState } from "react";
import { catalogProducts, type CatalogProduct } from "../catalog-products";
import { catalogProducts2 } from "../catalog-products-2";

const WHATSAPP = "529931520202";
type CartItem = CatalogProduct & { quantity: number };
const whatsappUrl = (message: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

export default function BagDetailPage() {
  const [family, setFamily] = useState("");
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [catalogId, setCatalogId] = useState("1");
  const activeProducts = catalogId === "2" ? catalogProducts2 : catalogProducts;
  const variants = family ? activeProducts.filter((product) => product.family === family) : [];
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartWhatsAppUrl = cart.length ? whatsappUrl([
    "Hola RAMBER, quiero solicitar una cotización:", "",
    ...cart.map((item) => `• ${item.family} · Modelo ${item.code} · ${item.color} · ${item.quantity} pieza${item.quantity > 1 ? "s" : ""}`),
    "", `Total de piezas: ${cartCount}`,
  ].join("\n")) : "#";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedCatalog = params.get("catalogo") === "2" ? "2" : "1";
    const products = requestedCatalog === "2" ? catalogProducts2 : catalogProducts;
    const requested = params.get("modelo") || products[0].family;
    const requestedCode = params.get("codigo");
    const found = products.filter((product) => product.family.toLocaleLowerCase("es") === requested.toLocaleLowerCase("es"));
    const safeVariants = found.length ? found : products.filter((product) => product.family === products[0].family);
    setCatalogId(requestedCatalog);
    setFamily(safeVariants[0].family);
    setSelected(safeVariants.find((product) => product.code === requestedCode) || safeVariants[0]);
    try { setCart(JSON.parse(localStorage.getItem("ramber-quote-cart") || "[]")); } catch { setCart([]); }
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (cartReady) localStorage.setItem("ramber-quote-cart", JSON.stringify(cart));
  }, [cart, cartReady]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addToCart = () => {
    if (!selected) return;
    setCart((current) => {
      const existing = current.find((item) => item.code === selected.code);
      if (existing) return current.map((item) => item.code === selected.code ? { ...item, quantity: item.quantity + quantity } : item);
      return [...current, { ...selected, quantity }];
    });
    setToast(`${quantity} pieza${quantity > 1 ? "s" : ""} del modelo ${selected.code} agregada${quantity > 1 ? "s" : ""}`);
  };

  const changeCartQuantity = (code: string, amount: number) => setCart((current) => current
    .map((item) => item.code === code ? { ...item, quantity: item.quantity + amount } : item)
    .filter((item) => item.quantity > 0));

  if (!selected) return <main className="detail-loading">Cargando modelo…</main>;

  return <main className="bag-detail-page">
    <header className="site-header">
      <a className="brand" href="/"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></a>
      <div className="header-actions"><a className="contact-link" href={`/bolsas${catalogId === "2" ? "?catalogo=2" : ""}`}>Bolsas</a><button className="header-cart" onClick={() => setCartOpen(true)} aria-label={`Abrir cotización, ${cartCount} piezas`}>Cotización{cartCount > 0 && <span>{cartCount}</span>}</button><a className="menu-button" href={`/bolsas${catalogId === "2" ? "?catalogo=2" : ""}`}>Volver</a></div>
    </header>

    <div className="bag-detail-shell">
      <a className="detail-back" href={`/bolsas${catalogId === "2" ? "?catalogo=2" : ""}`}>← Todos los modelos del Catálogo {catalogId}</a>
      <div className="bag-detail-layout">
        <div className="detail-main-image">
          <img src={selected.image} alt={`${family} modelo ${selected.code} color ${selected.color}`}/>
          <span>Modelo {selected.code}</span>
        </div>
        <section className="detail-config-card">
          <p className="eyebrow wine">BOLSA</p>
          <h1>{family}</h1>
          <h2>Modelo {selected.code} · {selected.color}</h2>
          <p className="detail-measurements">{selected.measurements.replace("Largo ", "").replace(" Ancho ", " × ").replace(" Alto ", " × ")}</p>
          <h3>Elige modelo y color</h3>
          <div className="detail-variant-strip">{variants.map((variant) => <button className={selected.code === variant.code ? "selected" : ""} key={variant.code} onClick={() => {setSelected(variant);setQuantity(1);}}>
            <img src={variant.image} alt=""/><strong>{variant.code}</strong><span>{variant.color}</span>
          </button>)}</div>
          <div className="detail-quantity"><strong>Cantidad</strong><div><button onClick={() => setQuantity(Math.max(1,quantity-1))}>−</button><span>{quantity}</span><button onClick={() => setQuantity(quantity+1)}>+</button></div></div>
          <button className="detail-add-button" onClick={addToCart}>Agregar a cotización</button>
          <p className="detail-note">Puedes elegir otro color y agregarlo también. Cada uno aparecerá por separado en tu cotización.</p>
        </section>
      </div>
    </div>

    <div className={`cart-backdrop ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
    <aside className={`cart-drawer ${cartOpen ? "open" : ""}`} aria-hidden={!cartOpen} aria-label="Tu cotización">
      <div className="cart-heading"><div><p>RAMBER</p><h2>Tu cotización ({cartCount})</h2></div><button onClick={() => setCartOpen(false)}>Cerrar</button></div>
      <div className="cart-items">{cart.length ? cart.map((item) => <article key={item.code}><img src={item.image} alt={`Modelo ${item.code} ${item.color}`}/><div><strong>{item.family}</strong><span>Modelo {item.code} · {item.color}</span><div className="cart-quantity"><button onClick={() => changeCartQuantity(item.code,-1)}>−</button><b>{item.quantity}</b><button onClick={() => changeCartQuantity(item.code,1)}>+</button></div></div></article>) : <div className="empty-cart"><p>Tu cotización está vacía.</p><span>Elige uno o varios colores y agrégalos aquí.</span></div>}</div>
      <a className={`send-cart-button ${!cart.length ? "disabled" : ""}`} href={cartWhatsAppUrl} target="_blank" rel="noopener noreferrer" aria-disabled={!cart.length} onClick={(event) => { if (!cart.length) event.preventDefault(); }}>Enviar por WhatsApp</a>
    </aside>
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}
