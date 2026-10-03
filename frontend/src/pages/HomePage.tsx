import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { categoriesApi, productsApi } from "../api";
import { resolveMediaUrl } from "../api/media";
import type { CategoryDto, ProductListItem } from "../api/types";
import { useAuth } from "../app/AuthContext";
import { ProductCard } from "../widgets/ProductCard";

const HERO_SLIDES = [
  { src: "/images/home/hero-slide-1.png?v=3", alt: "Upgrade kitchenware today. Sale -50%" },
  { src: "/images/home/hero-slide-2.png?v=3", alt: "Beach ready. Sale on swimsuits" },
] as const;

function scrollTrack(el: HTMLElement | null, dir: 1 | -1) {
  if (!el) return;
  el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 520), behavior: "smooth" });
}

function CategoryCarousel({ items }: { items: CategoryDto[] }) {
  const track = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  return (
    <div className="carousel carousel--categories">
      <button type="button" className="carousel-btn" aria-label="Previous" onClick={() => scrollTrack(track.current, -1)}>
        <img src="/icons/carousel-prev.svg" alt="" width={24} height={24} />
      </button>
      <div className="carousel__viewport">
        <div className="carousel__track category-track" ref={track}>
          {items.map((cat) => {
            const img = resolveMediaUrl(cat.imageUrl) || resolveMediaUrl(cat.iconUrl);
            return (
            <Link key={cat.id} className="category-card" to={`/products?categoryId=${cat.id}`}>
              <div className="category-card__img">
                {img && (
                  <img src={img} alt={cat.name} loading="lazy" />
                )}
              </div>
              <div className="category-card__title">{cat.name}</div>
              <span className="category-card__link">See all &gt;</span>
            </Link>
            );
          })}
        </div>
      </div>
      <button type="button" className="carousel-btn" aria-label="Next" onClick={() => scrollTrack(track.current, 1)}>
        <img src="/icons/carousel-next.svg" alt="" width={24} height={24} />
      </button>
    </div>
  );
}

function ProductCarousel({ items }: { items: ProductListItem[] }) {
  const track = useRef<HTMLDivElement>(null);
  if (items.length === 0) return null;
  return (
    <div className="carousel carousel--products">
      <button type="button" className="carousel-btn" aria-label="Previous" onClick={() => scrollTrack(track.current, -1)}>
        <img src="/icons/carousel-prev.svg" alt="" width={24} height={24} />
      </button>
      <div className="carousel__viewport">
        <div className="carousel__track product-track" ref={track}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
      <button type="button" className="carousel-btn" aria-label="Next" onClick={() => scrollTrack(track.current, 1)}>
        <img src="/icons/carousel-next.svg" alt="" width={24} height={24} />
      </button>
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const [cats, setCats] = useState<CategoryDto[]>([]);
  const [trending, setTrending] = useState<ProductListItem[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductListItem[]>([]);
  const [hero, setHero] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      categoriesApi.tree(),
      productsApi.list({ pageSize: 12, sort: "newest" }),
      productsApi.list({ pageSize: 12, sort: "rating" }),
    ])
      .then(([c, t, b]) => {
        setCats(c);
        setTrending(t.items);
        setBestSellers(b.items.length ? b.items : t.items);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setHero((h) => (h + 1) % HERO_SLIDES.length), 6000);
    return () => window.clearInterval(id);
  }, []);

  const row1 = cats.slice(0, Math.ceil(cats.length / 2) || cats.length);
  const row2 = cats.slice(Math.ceil(cats.length / 2));

  return (
    <div className="home" data-figma="722:5792">
      {error && <p className="error-banner">{error} — start Perry.Api on :5272</p>}

      {/* Figma Desktop - Main · hero Group 4 (722:5793) */}
      <section className="home-hero" aria-label="Promotions" data-figma="722:5793">
        <button
          type="button"
          className="carousel-btn carousel-btn--prev"
          aria-label="Previous slide"
          onClick={() => setHero((h) => (h - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
        >
          <img src="/icons/carousel-prev.svg" alt="" width={24} height={24} />
        </button>
        <div className="home-hero__track">
          {HERO_SLIDES.map((slide, i) => (
            <article key={`hero-${i}`} className={`home-hero__slide ${hero === i ? "is-active" : ""}`}>
              <img src={slide.src} alt={slide.alt} />
            </article>
          ))}
          <div className="home-hero__dots" role="tablist" aria-label="Slides">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={hero === i}
                className={`home-hero__dot ${hero === i ? "is-active" : ""}`}
                aria-label={`Slide ${i + 1}`}
                onClick={() => setHero(i)}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          className="carousel-btn carousel-btn--next"
          aria-label="Next slide"
          onClick={() => setHero((h) => (h + 1) % HERO_SLIDES.length)}
        >
          <img src="/icons/carousel-next.svg" alt="" width={24} height={24} />
        </button>
      </section>

      <section className="home-section home-section--cats">
        <CategoryCarousel items={row1.length ? row1 : cats} />
      </section>

      <hr className="home-divider" />

      <section className="home-section">
        <div className="section-head">
          <h2>Trending deals</h2>
          <Link to="/products">See all &gt;</Link>
        </div>
        <ProductCarousel items={trending} />
      </section>

      <hr className="home-divider" />

      {row2.length > 0 && (
        <>
          <section className="home-section home-section--cats">
            <CategoryCarousel items={row2} />
          </section>
          <hr className="home-divider" />
        </>
      )}

      <section className="home-section">
        <div className="section-head">
          <h2>Sale</h2>
          <Link to="/products?sort=discount">See all &gt;</Link>
        </div>
        <ProductCarousel items={bestSellers} />
      </section>

      {/* CTA — пропорции как на цветном макете Perry */}
      <section className="home-cta" aria-label="Join Perry">
        <div className="home-cta__inner">
          <img className="home-cta__bg" src="/images/home/cta-banner.png?v=3" alt="" />
          <div className="home-cta__copy">
            {user ? (
              <>
                <h2>Welcome back, {user.name.split(" ")[0] || "friend"}</h2>
                <p>Pick up where you left off — deals and favourites await.</p>
                <div className="home-cta__actions">
                  <Link className="btn btn-cta-primary" to="/products">
                    Go to catalog
                  </Link>
                  <Link className="btn btn-cta-secondary" to="/account/orders">
                    My orders
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Abundance of goods</h2>
                <p>Join, choose and buy with confidence!</p>
                <div className="home-cta__actions">
                  <Link className="btn btn-cta-primary" to="/register">
                    Sign up
                  </Link>
                  <Link className="btn btn-cta-ghost" to="/login">
                    Log in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
