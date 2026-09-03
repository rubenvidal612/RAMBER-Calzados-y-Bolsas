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
    heroEyebrow: "NUEVA COLECCIÓN",
    heroTitle: "Encuentra la bolsa que va contigo",
    heroImage: "/images/ramber-hero.png",
    heroPrimary: "Descubrir bolsas",
    heroSecondary: "Pedir cotización",
    opportunityImage: "/images/ramber-vende-sin-invertir.png",
    opportunityEyebrow: "OPORTUNIDAD RAMBER",
    opportunityTitle: "Tu estilo también puede darte ingresos.",
    opportunityLead: "Compra para ti, compra por mayoreo o vende por catálogo sin invertir en inventario.",
    opportunityOneTitle: "Menudeo", opportunityOneText: "Elige tu bolsa favorita desde $280.",
    opportunityTwoTitle: "Mayoreo", opportunityTwoText: "Mayoreo a partir de 2 bolsas.",
    opportunityThreeTitle: "Vende sin invertir", opportunityThreeText: "Próximamente: comparte el catálogo, toma pedidos y genera ingresos.",
    featuredEyebrow: "SELECCIÓN RAMBER", featuredTitle: "Nuevos modelos", featuredText: "Esta portada queda libre para mostrar promociones, lanzamientos y novedades.",
    productOneName: "Mochila para mujer", productOneCode: "RAM-001", productOneColor: "Café", productOneImage: "/images/producto-mochila-cafe.jpeg",
    productTwoName: "Bolsa casual", productTwoCode: "RAM-002", productTwoColor: "Negro o azul", productTwoImage: "/images/producto-bolsa-casual.jpeg",
    productThreeName: "Bolso elegante", productThreeCode: "RAM-003", productThreeColor: "Beige", productThreeImage: "/images/producto-bolso-beige.jpeg",
    footwearEyebrow: "PRÓXIMAMENTE", footwearTitle: "Calzado para toda la familia", footwearText: "Estamos preparando los nuevos modelos. Muy pronto podrás verlos y pedirlos desde aquí.",
    womenShoesTitle: "Calzado para dama", womenShoesText: "Moda, comodidad y nuevos estilos.", womenShoesImage: "/images/ramber-shoe-tile.png",
    kidsShoesTitle: "Calzado infantil", kidsShoesText: "Modelos para niñas y niños.", kidsShoesImage: "",
    catalogEyebrow: "DESCARGAS", catalogTitle: "Descarga nuestros catálogos", catalogText: "Inspírate con nuestras colecciones y descubre lo nuevo.",
    catalogOneTitle: "Catálogo 1", catalogOneImage: "/images/catalog-wine.png", catalogTwoTitle: "Catálogo 2", catalogTwoImage: "/images/catalog-olive.png",
    quoteEyebrow: "COTIZACIÓN", quoteTitle: "¿Encontraste una bolsa que te gustó?", quoteText: "También puedes armar una cotización con varios modelos desde la sección Bolsas.",
    storesEyebrow: "VISÍTANOS", storesTitle: "Dos sucursales para atenderte", storesText: "Conoce nuestras tiendas RAMBER en Villahermosa, Tabasco.",
    crystalTitle: "Plaza Crystal", crystalImage: "/images/ramber-plaza-crystal.jpeg", americasTitle: "Plaza Las Américas", americasImage: "/images/ramber-plaza-las-americas.jpeg",
    footerTagline: "Estilo que te acompaña.", whatsapp: "993 152 0202",
    instagram: "@RAMBERCB",
    facebook: "RAMBER",
    crystal: "RAMBER Plaza Crystal · Villahermosa, Tabasco",
    americas: "RAMBER Plaza Las Américas · Villahermosa, Tabasco",
  });
  const [news, setNews] = useState<Array<{ id: number; title: string; body: string; imageUrl: string }>>([]);
  const featuredProducts = [
    { code: content.productOneCode, name: content.productOneName, color: content.productOneColor, image: content.productOneImage },
    { code: content.productTwoCode, name: content.productTwoName, color: content.productTwoColor, image: content.productTwoImage },
    { code: content.productThreeCode, name: content.productThreeName, color: content.productThreeColor, image: content.productThreeImage },
  ];

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
      <nav><button onClick={() => goTo("inicio")}>Inicio</button><a className="admin-menu-link" href="/admin">Admin</a><a href="/bolsas">Bolsas</a><button onClick={() => goTo("calzado")}>Calzado dama</button><button onClick={() => goTo("calzado")}>Calzado infantil</button><a href="/mayoreo">Mayoreo</a><button onClick={() => goTo("destacados")}>Novedades</button><button onClick={() => goTo("oportunidad")}>Vende sin invertir</button><button onClick={() => goTo("catalogos")}>Catálogos</button><button onClick={() => goTo("pedidos")}>Pedidos</button><button onClick={() => goTo("contacto")}>Contacto</button></nav>
      <p>Estilo que te acompaña.</p>
    </div>

    <section id="inicio" className="hero">
      <img src={content.heroImage} alt="Colección RAMBER" />
      <div className="hero-shade" />
      <div className="hero-copy"><p className="eyebrow">{content.heroEyebrow}</p><h1>{content.heroTitle}</h1><div className="title-rule" />
        <a className="primary-button" href="/bolsas">{content.heroPrimary} <span>→</span></a>
        <a className="secondary-button" href={whatsappUrl("Hola RAMBER, quiero solicitar una cotización de una bolsa.")} target="_blank" rel="noreferrer">{content.heroSecondary}</a>
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
      <div className="opportunity-image reveal"><img src={content.opportunityImage} alt="Oportunidad RAMBER" /></div>
      <div className="opportunity-copy reveal"><p className="eyebrow">{content.opportunityEyebrow}</p><h2>{content.opportunityTitle}</h2><p className="opportunity-lead">{content.opportunityLead}</p>
        <div className="opportunity-options"><article><span>01</span><div><strong>{content.opportunityOneTitle}</strong><p>{content.opportunityOneText}</p></div></article><article><span>02</span><div><strong>{content.opportunityTwoTitle}</strong><p>{content.opportunityTwoText}</p></div></article><article><span>03</span><div><strong>{content.opportunityThreeTitle}</strong><p>{content.opportunityThreeText}</p></div></article></div>
        <div className="opportunity-actions"><a className="primary-button" href="/bolsas">Comprar bolsas <span>→</span></a><a className="wholesale-link" href="/mayoreo">Ver precios de mayoreo</a><a className="seller-button" href="/mayoreo#vende-sin-invertir">Vende sin invertir <small>Próximamente</small></a></div>
      </div>
    </section>

    <section id="destacados" className="section products-section">
      <div className="section-heading reveal"><p className="eyebrow wine">{content.featuredEyebrow}</p><h2>{content.featuredTitle}</h2><p>{content.featuredText}</p></div>
      <div className="product-track">{featuredProducts.map((product,index) => <article className="product reveal" style={{transitionDelay:`${index*100}ms`}} key={product.code}>
        <img src={product.image} alt={`${product.name} color ${product.color}`}/><div><p>{product.code}</p><h3>{product.name}</h3><span>{product.color}</span></div>
        <a href={whatsappUrl(`Hola RAMBER, quiero cotizar el modelo ${product.code} ${product.name}, color ${product.color}.`)} target="_blank" rel="noreferrer">Cotizar modelo</a>
      </article>)}</div>
      <a className="load-more-button" href="/bolsas">Ver todas las bolsas</a>
    </section>

    {news.length > 0 && <section className="section news-section"><div className="section-heading reveal"><p className="eyebrow wine">RECIÉN LLEGADO</p><h2>Novedades RAMBER</h2><p>Conoce promociones, colecciones y modelos nuevos.</p></div><div className="news-grid">{news.map((item) => <article className="news-card reveal" key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt={item.title}/>}<div><h3>{item.title}</h3>{item.body && <p>{item.body}</p>}<a href="/bolsas">Ver colección</a></div></article>)}</div></section>}

    <section id="calzado" className="section footwear-section"><div className="section-heading reveal"><p className="eyebrow wine">{content.footwearEyebrow}</p><h2>{content.footwearTitle}</h2><p>{content.footwearText}</p></div><div className="footwear-grid"><article className="footwear-card reveal"><img src={content.womenShoesImage} alt="Calzado para dama RAMBER"/><div><p>RAMBER</p><h3>{content.womenShoesTitle}</h3><span>{content.womenShoesText}</span></div></article><article className="footwear-card reveal">{content.kidsShoesImage ? <img src={content.kidsShoesImage} alt="Calzado infantil RAMBER"/> : <div className="footwear-kids">RAMBER<small>INFANTIL</small></div>}<div><p>RAMBER</p><h3>{content.kidsShoesTitle}</h3><span>{content.kidsShoesText}</span></div></article></div></section>

    <section id="catalogos" className="section catalogs-section">
      <div className="section-heading reveal"><p className="download-mark">{content.catalogEyebrow}</p><h2>{content.catalogTitle}</h2><p>{content.catalogText}</p></div>
      <div className="catalog-grid">{[{title:content.catalogOneTitle,image:content.catalogOneImage,tone:"vino",file:"/catalogos/catalogo-1-bolsas-2026.pdf"},{title:content.catalogTwoTitle,image:content.catalogTwoImage,tone:"olivo",file:"/catalogos/catalogo-2-textil-2026.pdf"}].map((catalog,index) => <article className={`catalog-book reveal ${catalog.tone}`} style={{transitionDelay:`${index*130}ms`}} key={catalog.title}>
        <img src={catalog.image} alt={`Portada de ${catalog.title}`}/><div><h3>{catalog.title}</h3><a href={catalog.file} download>Descargar PDF</a></div>
      </article>)}</div>
    </section>

    <section id="pedidos" className="quote-section"><div className="quote-intro reveal"><p className="eyebrow">{content.quoteEyebrow}</p><h2>{content.quoteTitle}</h2><p>{content.quoteText}</p><a className="secondary-button" href="/bolsas">Ir a Bolsas</a></div>
      <form className="quote-form reveal" onSubmit={sendQuote}><label>Tu nombre<input name="name" required placeholder="Nombre"/></label><label>Modelo<input name="model" required placeholder="Ej. 4125"/></label><div className="form-row"><label>Color<input name="color" required placeholder="Camel"/></label><label>Cantidad<input name="quantity" required type="number" min="1" defaultValue="1"/></label></div><button type="submit">Enviar cotización</button></form>
    </section>

    <section className="stores-section"><div className="stores-heading reveal"><p className="eyebrow wine">{content.storesEyebrow}</p><h2>{content.storesTitle}</h2><p>{content.storesText}</p></div><div className="stores-grid"><article className="store-card reveal"><img src={content.crystalImage} alt="Sucursal RAMBER Plaza Crystal"/><div><p>RAMBER</p><h3>{content.crystalTitle}</h3><span>{content.crystal.replace("RAMBER Plaza Crystal · ", "")}</span></div></article><article className="store-card reveal"><img src={content.americasImage} alt="Sucursal RAMBER Plaza Las Américas"/><div><p>RAMBER</p><h3>{content.americasTitle}</h3><span>{content.americas.replace("RAMBER Plaza Las Américas · ", "")}</span></div></article></div></section>
    <footer id="contacto"><div className="footer-brand"><span>RAMBER</span><small>CALZADOS Y BOLSAS</small></div><div className="footer-contact"><p>{content.footerTagline}</p><a href="https://www.instagram.com/rambercb" target="_blank" rel="noreferrer">Instagram · {content.instagram}</a><a href={whatsappUrl("Hola RAMBER, quiero más información.")} target="_blank" rel="noreferrer">WhatsApp · {content.whatsapp}</a><span>Facebook · {content.facebook}</span></div></footer>
  </main>;
}
