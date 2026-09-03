"use client";

import { FormEvent, useEffect, useState } from "react";

const WHATSAPP = "529931520202";
const products = [
  { code: "RAM-001", name: "Mochila para mujer", color: "Café", image: "/images/producto-mochila-cafe.jpeg" },
  { code: "RAM-002", name: "Bolsa casual", color: "Negro o azul", image: "/images/producto-bolsa-casual.jpeg" },
  { code: "RAM-003", name: "Bolso elegante", color: "Beige", image: "/images/producto-bolso-beige.jpeg" },
];
const whatsappUrl = (message: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [content, setContent] = useState({
    heroTitle: "Encuentra la bolsa que va contigo",
    heroImage: "/images/ramber-hero.png",
    instagram: "@RAMBERCB",
    facebook: "RAMBER",
    crystal: "RAMBER Plaza Crystal · Villahermosa, Tabasco",
    americas: "RAMBER Plaza Las Américas · Villahermosa, Tabasco",
  });
  const [news, setNews] = useState<Array<{ id: number; title: string; body: string; imageUrl: string }>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { threshold: 0.14 },
    );
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/content").then((response) => response.json()).then((data) => {
      setContent((current) => ({ ...current, ...(data.settings || {}) }));
      setNews(data.news || []);
    }).catch(() => undefined);
  }, []);

  const goTo = (id: string) => {
    setMenuOpen(false);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const sendQuote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      "Hola RAMBER, quiero solicitar una cotización:",
      `Nombre: ${data.get("name")}`, `Modelo: ${data.get("model")}`,
      `Color: ${data.get("color")}`, `Cantidad: ${data.get("quantity")}`,
    ].join("\n");
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  };

  return <main>
    <header className="site-header">
      <a className="brand" href="#inicio"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></a>
      <div className="header-actions"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>Menú</button></div>
    </header>

    <div className={`menu-overlay ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
      <button className="close-menu" onClick={() => setMenuOpen(false)}>Cerrar</button>
      <nav><button onClick={() => goTo("inicio")}>Inicio</button><a href="/bolsas">Bolsas</a><button onClick={() => goTo("calzado")}>Calzado dama</button><button onClick={() => goTo("calzado")}>Calzado infantil</button><a href="/mayoreo">Mayoreo</a><button onClick={() => goTo("destacados")}>Novedades</button><button onClick={() => goTo("oportunidad")}>Vende sin invertir</button><button onClick={() => goTo("catalogos")}>Catálogos</button><button onClick={() => goTo("pedidos")}>Pedidos</button><button onClick={() => goTo("contacto")}>Contacto</button><a href="/admin">Admin</a></nav>
      <p>Estilo que te acompaña.</p>
    </div>

    <section id="inicio" className="hero">
      <img src={content.heroImage} alt="Colección RAMBER" />
      <div className="hero-shade" />
      <div className="hero-copy"><p className="eyebrow">NUEVA COLECCIÓN</p><h1>{content.heroTitle}</h1><div className="title-rule" />
        <a className="primary-button" href="/bolsas">Descubrir bolsas <span>→</span></a>
        <a className="secondary-button" href={whatsappUrl("Hola RAMBER, quiero solicitar una cotización de una bolsa.")} target="_blank" rel="noreferrer">Pedir cotización</a>
      </div><div className="scroll-dots"><span className="active"/><span/><span/></div>
    </section>

    <nav className="category-ribbon">
      <a href="/bolsas"><img src="/images/ramber-bag-tile.png" alt="Bolsa"/><strong>Bolsas</strong></a>
      <button onClick={() => goTo("calzado")}><img src="/images/ramber-shoe-tile.png" alt="Calzado para dama"/><strong>Calzado dama</strong></button>
      <button onClick={() => goTo("calzado")}><span className="catalog-mini">RAMBER<small>INFANTIL</small></span><strong>Calzado infantil</strong></button>
      <button onClick={() => goTo("destacados")}><img src="/images/ramber-shoe-tile.png" alt="Nuevos modelos"/><strong>Nuevos modelos</strong></button>
      <button onClick={() => goTo("catalogos")}><span className="catalog-mini">RAMBER<small>CATÁLOGOS</small></span><strong>Catálogos</strong></button>
    </nav>

    <section id="oportunidad" className="opportunity-section">
      <div className="opportunity-image reveal"><img src="/images/ramber-vende-sin-invertir.png" alt="Mujer mostrando una bolsa RAMBER desde su celular" /></div>
      <div className="opportunity-copy reveal"><p className="eyebrow">OPORTUNIDAD RAMBER</p><h2>Tu estilo también puede darte <em>ingresos.</em></h2><p className="opportunity-lead">Compra para ti, compra por mayoreo o vende por catálogo sin invertir en inventario.</p>
        <div className="opportunity-options"><article><span>01</span><div><strong>Menudeo</strong><p>Elige tu bolsa favorita desde $280.</p></div></article><article><span>02</span><div><strong>Mayoreo</strong><p>Mayoreo a partir de 2 bolsas.</p></div></article><article><span>03</span><div><strong>Vende sin invertir</strong><p>Próximamente: comparte el catálogo, toma pedidos y genera ingresos.</p></div></article></div>
        <div className="opportunity-actions"><a className="primary-button" href="/bolsas">Comprar bolsas <span>→</span></a><a className="wholesale-link" href="/mayoreo">Ver precios de mayoreo</a><a className="seller-button" href="/mayoreo#vende-sin-invertir">Vende sin invertir <small>Próximamente</small></a></div>
      </div>
    </section>

    <section id="destacados" className="section products-section">
      <div className="section-heading reveal"><p className="eyebrow wine">SELECCIÓN RAMBER</p><h2>Nuevos modelos</h2><p>Esta portada queda libre para mostrar promociones, lanzamientos y novedades.</p></div>
      <div className="product-track">{products.map((product,index) => <article className="product reveal" style={{transitionDelay:`${index*100}ms`}} key={product.code}>
        <img src={product.image} alt={`${product.name} color ${product.color}`}/><div><p>{product.code}</p><h3>{product.name}</h3><span>{product.color}</span></div>
        <a href={whatsappUrl(`Hola RAMBER, quiero cotizar el modelo ${product.code} ${product.name}, color ${product.color}.`)} target="_blank" rel="noreferrer">Cotizar modelo</a>
      </article>)}</div>
      <a className="load-more-button" href="/bolsas">Ver todas las bolsas</a>
    </section>

    {news.length > 0 && <section className="section news-section"><div className="section-heading reveal"><p className="eyebrow wine">RECIÉN LLEGADO</p><h2>Novedades RAMBER</h2><p>Conoce promociones, colecciones y modelos nuevos.</p></div><div className="news-grid">{news.map((item) => <article className="news-card reveal" key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt={item.title}/>}<div><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}<a href="/bolsas">Ver colección</a></div></article>)}</div></section>}

    <section id="calzado" className="section footwear-section"><div className="section-heading reveal"><p className="eyebrow wine">PRÓXIMAMENTE</p><h2>Calzado para toda la familia</h2><p>Estamos preparando los nuevos modelos. Muy pronto podrás verlos y pedirlos desde aquí.</p></div><div className="footwear-grid"><article className="footwear-card reveal"><img src="/images/ramber-shoe-tile.png" alt="Calzado para dama RAMBER"/><div><p>RAMBER</p><h3>Calzado para dama</h3><span>Moda, comodidad y nuevos estilos.</span></div></article><article className="footwear-card reveal"><div className="footwear-kids">RAMBER<small>INFANTIL</small></div><div><p>RAMBER</p><h3>Calzado infantil</h3><span>Modelos para niñas y niños.</span></div></article></div></section>

    <section id="catalogos" className="section catalogs-section">
      <div className="section-heading reveal"><p className="download-mark">DESCARGAS</p><h2>Descarga nuestros catálogos</h2><p>Inspírate con nuestras colecciones y descubre lo nuevo.</p></div>
      <div className="catalog-grid">{[{title:"Catálogo 1",image:"/images/catalog-wine.png",tone:"vino",file:"/catalogos/catalogo-1-bolsas-2026.pdf"},{title:"Catálogo 2",image:"/images/catalog-olive.png",tone:"olivo",file:"/catalogos/catalogo-2-textil-2026.pdf"}].map((catalog,index) => <article className={`catalog-book reveal ${catalog.tone}`} style={{transitionDelay:`${index*130}ms`}} key={catalog.title}>
        <img src={catalog.image} alt={`Portada de ${catalog.title}`}/><div><h3>{catalog.title}</h3><a href={catalog.file} download>Descargar PDF</a></div>
      </article>)}</div>
    </section>

    <section id="pedidos" className="quote-section"><div className="quote-intro reveal"><p className="eyebrow">COTIZACIÓN</p><h2>¿Encontraste una bolsa que te gustó?</h2><p>También puedes armar una cotización con varios modelos desde la sección Bolsas.</p><a className="secondary-button" href="/bolsas">Ir a Bolsas</a></div>
      <form className="quote-form reveal" onSubmit={sendQuote}><label>Tu nombre<input name="name" required placeholder="Nombre"/></label><label>Modelo<input name="model" required placeholder="Ej. 4125"/></label><div className="form-row"><label>Color<input name="color" required placeholder="Camel"/></label><label>Cantidad<input name="quantity" required type="number" min="1" defaultValue="1"/></label></div><button type="submit">Enviar cotización</button></form>
    </section>

    <section className="stores-section"><div className="stores-heading reveal"><p className="eyebrow wine">VISÍTANOS</p><h2>Dos sucursales para atenderte</h2><p>Conoce nuestras tiendas RAMBER en Villahermosa, Tabasco.</p></div><div className="stores-grid"><article className="store-card reveal"><img src="/images/ramber-plaza-crystal.jpeg" alt="Sucursal RAMBER Plaza Crystal"/><div><p>RAMBER</p><h3>Plaza Crystal</h3><span>{content.crystal.replace("RAMBER Plaza Crystal · ", "")}</span></div></article><article className="store-card reveal"><img src="/images/ramber-plaza-las-americas.jpeg" alt="Sucursal RAMBER Plaza Las Américas"/><div><p>RAMBER</p><h3>Plaza Las Américas</h3><span>{content.americas.replace("RAMBER Plaza Las Américas · ", "")}</span></div></article></div></section>
    <footer id="contacto"><div className="footer-brand"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></div><div className="footer-contact"><p>Estilo que te acompaña.</p><a href="https://www.instagram.com/rambercb" target="_blank" rel="noreferrer">Instagram · {content.instagram}</a><a href={whatsappUrl("Hola RAMBER, quiero más información.")} target="_blank" rel="noreferrer">WhatsApp · 993 152 0202</a><span>Facebook · {content.facebook}</span></div></footer>
  </main>;
}
