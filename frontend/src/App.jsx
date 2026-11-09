import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BadgeCheck, Gem, Menu, Search, ShieldCheck, Sparkles, X, Heart, Eye, Clock3 } from 'lucide-react';
import initialProducts from './data/products.json';
import AdminPage from './pages/AdminPage.jsx';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WA = import.meta.env.VITE_WHATSAPP_NUMBER || '2347054301807';
const API_ORIGIN = API.replace(/\/api$/, '');
const imageSrc = (image) => image?.startsWith('/uploads/') ? `${API_ORIGIN}${image}` : image;
const money = (value) => value ? `₦${Number(value).toLocaleString('en-NG')}` : 'Ask for price';

function waLink(product, whatsappNumber = WA) {
  const photoUrl = product.image?.startsWith('/uploads/') ? `${API_ORIGIN}${product.image}` : product.image?.startsWith('/') ? `${window.location.origin}${product.image}` : product.image;
  const message = `Hello Rahama Essentials! I am interested in ${product.name}.\n\n${product.description || ''}\n\nProduct photo: ${photoUrl}\n\nPlease share the price and availability.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function Storefront() {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All pieces');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});
  const [favourites, setFavourites] = useState(() => JSON.parse(localStorage.getItem('rahama_favourites') || '[]'));
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem('rahama_recent') || '[]'));
  const [quickView, setQuickView] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    Promise.all([fetch(`${API}/products`).then((r) => r.ok ? r.json() : Promise.reject()), fetch(`${API}/settings`).then(r=>r.ok?r.json():Promise.reject()).catch(()=>({data:{}}))]).then(([payload, store]) => {
      if (alive) setSettings(store.data || {});
      if (!alive || !payload.success) return;
      setProducts(payload.data || []);
      setCategories(payload.categories || []);
    }).catch(() => {
      if (alive) setCategories([...new Set(initialProducts.map((p) => p.category))].sort());
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [location.key]);

  const allCategories = useMemo(() => ['All pieces', ...new Set([...categories, ...products.map((p) => p.category)])], [categories, products]);
  const filtered = useMemo(() => products.filter((p) => {
    const matchesCategory = activeCategory === 'All pieces' || p.category === activeCategory;
    const term = query.trim().toLowerCase();
    const matchesSearch = !term || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term);
    return matchesCategory && matchesSearch && p.available !== false;
  }), [products, activeCategory, query]);
  const slides = ([...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].filter((p) => p.available !== false && p.draft !== true && p.image).slice(0, 6));
  const featured = products.filter((p) => p.featured).slice(0, 4);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => setSlideIndex((current) => (current + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);
  const activeSlide = slides[slideIndex] || products[0] || initialProducts[0];
  const whatsapp = settings.whatsapp || WA;
  function toggleFavourite(id){const next=favourites.includes(id)?favourites.filter(x=>x!==id):[...favourites,id];setFavourites(next);localStorage.setItem('rahama_favourites',JSON.stringify(next));}
  function openQuickView(product){setQuickView(product);const next=[product.id,...recent.filter(x=>x!==product.id)].slice(0,8);setRecent(next);localStorage.setItem('rahama_recent',JSON.stringify(next));}
  const favouriteProducts=products.filter(p=>favourites.includes(p.id));
  const recentProducts=recent.map(id=>products.find(p=>p.id===id)).filter(Boolean);

  return <div className="site-shell">
    <div className="announcement"><Sparkles size={13} /> {settings.announcement || 'A little detail makes a lasting impression'} <span>✦</span> Enquiries via WhatsApp</div>
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Rahama Essentials home"><span className="brand-mark"><Gem size={21}/></span><span>{settings.storeName || 'RAHAMA'} <b>ESSENTIALS</b><small>{settings.tagline || 'STYLE IN EVERY DETAIL'}</small></span></Link>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <a href="#collection" onClick={() => setMenuOpen(false)}>Collection</a><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
      </nav>
      <div className="header-actions"><a className="admin-link" href="/admin">Admin <ShieldCheck size={15}/></a><a className="header-cta" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Rahama Essentials, I would like to make an enquiry.')}`} target="_blank" rel="noreferrer">Let's talk <ArrowUpRight size={16}/></a><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button></div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
        <div className="hero-copy"><div className="eyebrow"><span/> THE RAHAMA EDIT</div><h1>{settings.heroTitle || <>Details that<br/><em>define you.</em></>}</h1><p>{settings.heroText || "Thoughtful finishing touches, statement pieces and everyday favourites — selected to make your style feel unmistakably yours."}</p><div className="hero-buttons"><a className="button-primary" href="#collection">Explore the collection <ArrowRight size={17}/></a><a className="button-quiet" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Chat with us <ArrowUpRight size={16}/></a></div><div className="hero-note"><span className="note-line"/> Curated with care. Chosen by you.</div></div>
        <div className="hero-art"><a className="hero-frame hero-slideshow" href={waLink(activeSlide, whatsapp)} target="_blank" rel="noreferrer" aria-label={`Enquire on WhatsApp about ${activeSlide.name}`}><img key={activeSlide.id} src={imageSrc(activeSlide.image)} alt={activeSlide.name}/><div className="image-label"><span>FEATURED PIECE · {activeSlide.category}</span><b>{activeSlide.name}</b><small>Tap the image to enquire on WhatsApp</small></div></a><div className="slide-controls" aria-label="Slideshow controls">{slides.slice(0,6).map((slide,i)=><button key={slide.id} className={slideIndex===i?'active':''} onClick={()=>setSlideIndex(i)} aria-label={`Show slide ${i+1}`}/>)}</div><div className="floating-stamp"><Gem size={18}/><span>THE ART OF<br/>ACCESSORISING</span></div><div className="hero-index">{String(slideIndex+1).padStart(2,'0')} <span>/</span> {String(slides.length).padStart(2,'0')}</div></div>
      </section>

      <section className="trust-row"><div><Gem/><span>Curated accessories</span></div><div><BadgeCheck/><span>Personal service</span></div><div><Sparkles/><span>Everyday to occasion</span></div></section>
      {products.some(p=>p.salePrice)&&<section className="offer-section"><div className="eyebrow"><span/> LIMITED-TIME PICKS</div><h2>Special offers<span>.</span></h2><p>Selected pieces with current special prices.</p><div className="offer-row">{products.filter(p=>p.salePrice&&p.available!==false).slice(0,4).map(p=><button key={p.id} onClick={()=>openQuickView(p)}><img src={imageSrc(p.image)} alt={p.name}/><span>{p.name}</span><b>{money(p.salePrice)}</b><del>{money(p.price)}</del></button>)}</div></section>}

      <section id="collection" className="collection-section">
        <div className="section-heading"><div><div className="eyebrow"><span/> FIND YOUR FINISH</div><h2>The collection<span>.</span></h2><p>Explore pieces for every mood, moment and personal style.</p></div><div className="collection-count"><b>{products.length.toString().padStart(2,'0')}</b><span>PIECES<br/>TO EXPLORE</span></div></div>
        <div className="catalog-tools"><div className="category-list">{allCategories.map((cat) => <button key={cat} className={activeCategory === cat ? 'category-chip active' : 'category-chip'} onClick={() => setActiveCategory(cat)}>{cat}</button>)}</div><label className="search-box"><Search size={17}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the collection"/><kbd>/</kbd></label></div>
        {loading && <div className="loading-line">Loading the collection…</div>}
        <div className="product-grid">{filtered.map((product, index) => <article className="product-card" key={product.id}><a className="product-image" href={waLink(product, whatsapp)} target="_blank" rel="noreferrer" aria-label={`Enquire on WhatsApp about ${product.name}`}><img src={imageSrc(product.image)} alt={product.name} loading={index > 7 ? 'lazy' : 'eager'}/><span className="image-view">Enquire on WhatsApp <ArrowUpRight size={15}/></span></a><button className={`favourite-button ${favourites.includes(product.id)?'saved':''}`} onClick={()=>toggleFavourite(product.id)} aria-label="Save favourite"><Heart size={17} fill={favourites.includes(product.id)?'currentColor':'none'}/></button><div className="product-info"><div><span className="product-category">{product.category}</span><h3>{product.name}</h3><p>{money(product.salePrice||product.price)} {product.salePrice&&<del>{money(product.price)}</del>}</p><p className="product-description">{product.description}</p><button className="quick-view-link" onClick={()=>openQuickView(product)}>Quick view <Eye size={13}/></button></div><a className="product-arrow" href={waLink(product, whatsapp)} target="_blank" rel="noreferrer" aria-label={`Enquire about ${product.name}`}><ArrowUpRight size={18}/></a></div></article>)}</div>
        {!filtered.length && <div className="empty-state"><Gem size={26}/><h3>No pieces found</h3><p>Try another search or choose a different category.</p><button onClick={() => {setQuery('');setActiveCategory('All pieces');}}>Clear filters</button></div>}
        {favouriteProducts.length>0&&<div className="saved-strip"><h3><Heart size={16}/> Your favourites</h3><div>{favouriteProducts.slice(0,6).map(p=><button key={p.id} onClick={()=>openQuickView(p)}><img src={imageSrc(p.image)} alt=""/><span>{p.name}</span></button>)}</div></div>}
        {recentProducts.length>0&&<div className="saved-strip"><h3><Clock3 size={16}/> Recently viewed</h3><div>{recentProducts.slice(0,6).map(p=><button key={p.id} onClick={()=>openQuickView(p)}><img src={imageSrc(p.image)} alt=""/><span>{p.name}</span></button>)}</div></div>}
      </section>

      <section className="feature-band"><div className="feature-copy"><div className="eyebrow"><span/> A NOTE FROM RAHAMA</div><h2>It’s not just<br/><em>what you wear.</em></h2><p>It’s the confidence in the little things. Discover accessories that help you show up exactly as you are — expressive, elegant and entirely yourself.</p><a className="text-link" href="#collection">Find your favourite piece <ArrowRight size={16}/></a></div><div className="feature-images">{featured.slice(0,3).map((p,i)=><div className={`feature-image fi-${i+1}`} key={p.id}><img src={imageSrc(p.image)} alt={p.name}/></div>)}</div></section>

      <section id="story" className="story-section"><div className="story-symbol"><Gem size={34}/><span>R</span></div><div><div className="eyebrow"><span/> THE RAHAMA EXPERIENCE</div><h2>Find the piece<br/>that feels like <em>you.</em></h2><p>Browse at your own pace, save the pieces that catch your eye and message us directly for prices, availability and product details. We’re happy to help you choose.</p></div><a className="round-link" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Rahama Essentials, please help me choose a piece.')}`} target="_blank" rel="noreferrer"><ArrowUpRight size={25}/></a></section>

      <section id="contact" className="contact-section"><div><div className="eyebrow"><span/> LET'S CONNECT</div><h2>Your next favourite<br/><em>is one message away.</em></h2></div><a className="contact-button" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hello Rahama Essentials! I would like to make an enquiry.')}`} target="_blank" rel="noreferrer">Enquire on WhatsApp <ArrowUpRight size={18}/></a></section>
    </main>
    {quickView&&<div className="quickview-backdrop" onClick={()=>setQuickView(null)}><section className="quickview-card" onClick={e=>e.stopPropagation()}><button className="quickview-close" onClick={()=>setQuickView(null)}><X/></button><img src={imageSrc(quickView.image)} alt={quickView.name}/><div><span className="product-category">{quickView.category}</span><h2>{quickView.name}</h2><p>{quickView.description}</p><strong>{money(quickView.salePrice||quickView.price)}</strong><a className="button-primary" href={waLink(quickView, whatsapp)} target="_blank" rel="noreferrer">Ask about this piece <ArrowUpRight size={16}/></a></div></section></div>}
    <footer className="site-footer"><Link to="/" className="brand footer-brand"><span className="brand-mark"><Gem size={19}/></span><span>{settings.storeName || 'RAHAMA'} <b>ESSENTIALS</b><small>{settings.tagline || 'STYLE IN EVERY DETAIL'}</small></span></Link><span>© {new Date().getFullYear()} Rahama Essentials. All rights reserved.</span><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp <ArrowUpRight size={14}/></a></footer>


  </div>;
}

export default function App() {
  return <Routes><Route path="/" element={<Storefront/>}/><Route path="/admin" element={<AdminPage api={API}/>}/><Route path="*" element={<Storefront/>}/></Routes>;
}
