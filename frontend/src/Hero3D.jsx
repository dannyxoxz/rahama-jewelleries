import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Gem, Pause, Play } from 'lucide-react';

const fallbackSlides = [
  { name: 'Jewellery for your special moments', category: 'THE SIGNATURE EDIT', description: 'Thoughtfully chosen pieces to make every moment feel a little more special.', image: '' },
];

export default function Hero3D({ products = [], whatsapp, imageSrc = (v) => v, waLink }) {
  const slides = useMemo(() => {
    const list = (Array.isArray(products) ? products : []).filter((p) => p?.image).slice(0, 7);
    return list.length ? list.map((p, i) => ({
      id: p.id || i, name: p.name || 'A piece to treasure', category: p.category || 'THE RAHAMA COLLECTION',
      description: p.description || 'Discover a beautiful piece selected to bring a special touch to your everyday style.',
      image: imageSrc(p.image), product: p,
    })) : fallbackSlides;
  }, [products, imageSrc]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const current = slides[active % slides.length];
  useEffect(() => { setActive(0); }, [slides.length]);
  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const timer = window.setInterval(() => setActive((v) => (v + 1) % slides.length), 5200);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);
  const move = (direction) => setActive((v) => (v + direction + slides.length) % slides.length);
  const contact = current.product && waLink ? waLink(current.product, whatsapp) : `https://wa.me/${whatsapp || '2347054301807'}`;
  return <section className="hero rahama-editorial-hero" aria-label="Rahama Jewelleries featured collection">
    <div className="rahama-hero-grain" aria-hidden="true" />
    <div className="rahama-hero-copy">
      <div className="rahama-hero-kicker"><span /> RAHAMA ESSENTIALS <b>✦</b></div>
      <div className="rahama-hero-index">CURATED WITH LOVE · {String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</div>
      <h1>Jewellery for<br/><em>your special</em><br/>moments.</h1>
      <p>Little details. Beautiful memories. Find a piece that feels like you, and make every moment shine.</p>
      <div className="rahama-hero-actions">
        <a className="rahama-hero-primary" href="#collection">Explore the collection <ArrowRight size={17}/></a>
        <a className="rahama-hero-secondary" href={`https://wa.me/${whatsapp || '2347054301807'}`} target="_blank" rel="noreferrer">We’re happy to help <ArrowUpRight size={16}/></a>
      </div>
      <div className="rahama-hero-trust"><Gem size={15}/> GOLD <i/> DIAMONDS <i/> SILVER</div>
    </div>
    <div className="rahama-slide-stage" onTouchStart={(e) => setTouchStart(e.touches[0].clientX)} onTouchEnd={(e) => { if (touchStart === null) return; const delta = e.changedTouches[0].clientX - touchStart; if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); setTouchStart(null); }}>
      <div className="rahama-slide-image-wrap" key={current.id}>
        {current.image ? <img className="rahama-slide-image" src={current.image} alt={current.name} fetchPriority="high" /> : <div className="rahama-slide-empty"><Gem size={64}/><span>RAHAMA ESSENTIALS</span></div>}
        <div className="rahama-slide-shade" />
      </div>
      <div className="rahama-slide-topline"><span>THE COLLECTION</span><span>EST. IN ELEGANCE</span></div>
      <div className="rahama-slide-caption"><div><span>{current.category}</span><h2>{current.name}</h2><p>{current.description}</p></div><a href={current.product ? contact : '#collection'} target={current.product ? '_blank' : undefined} rel={current.product ? 'noreferrer' : undefined} aria-label="Enquire about this piece"><ArrowUpRight size={22}/></a></div>
      <div className="rahama-slide-controls"><div className="rahama-slide-dots">{slides.map((s, i) => <button key={s.id} className={i === active ? 'active' : ''} onClick={() => setActive(i)} aria-label={`Show slide ${i + 1}`} />)}</div><div className="rahama-slide-buttons"><button onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button><button onClick={() => move(-1)} aria-label="Previous slide"><ChevronLeft size={18}/></button><button onClick={() => move(1)} aria-label="Next slide"><ChevronRight size={18}/></button></div></div>
    </div>
    <div className="rahama-hero-bottom"><span>MADE FOR THE MOMENTS THAT MATTER</span><span>GOLD · DIAMONDS · SILVER</span></div>
  </section>;
}
