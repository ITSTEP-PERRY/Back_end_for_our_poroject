import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { productsApi, reviewsApi } from "../api";
import { isOwnReview, resolveReviewAuthor } from "../utils/reviewAuthor";
import { ReviewAvatar } from "../widgets/ReviewAvatar";
import {
  translateReviewToUkrainian,
  type ReviewTranslation,
} from "../utils/translateToUk";
import { ApiError } from "../api/client";
import type { ProductDetail, ProductListItem, ProductReview } from "../api/types";
import { useAuth } from "../app/AuthContext";
import { useCart } from "../app/CartContext";
import { useWishlist } from "../app/WishlistContext";
import { ImageLightbox } from "../widgets/ImageLightbox";
import { ProductCard } from "../widgets/ProductCard";
import { CreateReviewModal } from "../widgets/CreateReviewModal";
import { PdpInfoModal, type PdpInfoKind } from "../widgets/PdpInfoModal";

function scrollTrack(el: HTMLElement | null, dir: 1 | -1) {
  if (!el) return;
  el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 480), behavior: "smooth" });
}

function ProductCarousel({ items, title, seeAllTo }: { items: ProductListItem[]; title: string; seeAllTo: string }) {
  const track = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  return (
    <section className="pdp-section pdp-section--related">
      <div className="section-head">
        <h2>{title}</h2>
        <Link to={seeAllTo}>See all &gt;</Link>
      </div>
      <div className="carousel carousel--pdp-related">
        <button type="button" className="carousel-btn carousel-btn--prev" aria-label="Previous" onClick={() => scrollTrack(track.current, -1)}>
          <img src="/icons/carousel-prev.svg" alt="" width={24} height={24} />
        </button>
        <div className="carousel__viewport">
          <div className="carousel__track product-track" ref={track}>
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
        <button type="button" className="carousel-btn carousel-btn--next" aria-label="Next" onClick={() => scrollTrack(track.current, 1)}>
          <img src="/icons/carousel-next.svg" alt="" width={24} height={24} />
        </button>
      </div>
    </section>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const ratingFilter = searchParams.get("rating");
  const { add } = useCart();
  const { user } = useAuth();
  const { has, toggle } = useWishlist();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [infoKind, setInfoKind] = useState<PdpInfoKind | null>(null);
  const [reviewSort, setReviewSort] = useState<"recent" | "rating_desc" | "rating_asc">("recent");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [reviewsVisible, setReviewsVisible] = useState(3);
  const [helpful, setHelpful] = useState<Record<string, number>>({});
  const [myHelpful, setMyHelpful] = useState<Record<string, boolean>>({});
  const [helpfulBusy, setHelpfulBusy] = useState<Record<string, boolean>>({});
  const [reviewTranslations, setReviewTranslations] = useState<
    Record<string, ReviewTranslation>
  >({});
  const [reviewShowUk, setReviewShowUk] = useState<Record<string, boolean>>({});
  const [translateBusy, setTranslateBusy] = useState<Record<string, boolean>>({});
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; alt?: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setError(null);
    setProduct(null);
    setInfoKind(null);
    setReviewSort("recent");
    setTagFilter(null);
    setReviewsVisible(3);
    setHelpful({});
    setMyHelpful({});
    setHelpfulBusy({});
    setReviewTranslations({});
    setReviewShowUk({});
    setTranslateBusy({});
    productsApi
      .byId(id)
      .then((p) => {
        setProduct(p);
        setActive(0);
        setQty(1);
      })
      .catch((e: Error) => {
        if (e instanceof ApiError && e.status === 404) setError("404 Not found");
        else setError(e.message);
      });
  }, [id]);

  // Hydrate "my Helpful" marks from Product API after reload (JWT).
  useEffect(() => {
    if (!user || !product?.reviews?.length) return;
    let cancelled = false;
    const reviews = product.reviews;
    void (async () => {
      const nextMine: Record<string, boolean> = {};
      const nextCounts: Record<string, number> = {};
      await Promise.all(
        reviews.map(async (r) => {
          const key = String(r.id);
          nextCounts[key] = r.totalHelpful ?? 0;
          try {
            const mine = await reviewsApi.myGrade(r.id);
            nextMine[key] = !!(mine.isHelpful ?? mine.IsHelpful);
          } catch {
            nextMine[key] = false;
          }
        }),
      );
      if (cancelled) return;
      setHelpful((prev) => ({ ...nextCounts, ...prev }));
      setMyHelpful((prev) => ({ ...nextMine, ...prev }));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, product?.id, product?.reviews]);

  // If the viewer has a review without a stored avatar, push Auth photo → Product /uploads.
  useEffect(() => {
    if (!user || !product?.reviews?.length) return;
    const needsSync = product.reviews.some((r) => {
      if (!isOwnReview(r, user)) return false;
      const author = (r.authorName || "").trim();
      const nameBad =
        !author ||
        /^[0-9a-f-]{36}$/i.test(author) ||
        author.includes("@") ||
        (!!user.name && author.toLowerCase() !== user.name.trim().toLowerCase());
      const avatarBad = !r.authorAvatarUrl?.startsWith("/uploads");
      return nameBad || avatarBad;
    });
    if (!needsSync) return;
    let cancelled = false;
    void reviewsApi
      .syncMyAvatar()
      .then((res) => {
        if (cancelled) return;
        if (!res.authorAvatarUrl && !res.authorName) return;
        setProduct((prev) => {
          if (!prev?.reviews) return prev;
          return {
            ...prev,
            reviews: prev.reviews.map((r) =>
              isOwnReview(r, user)
                ? {
                    ...r,
                    authorName: res.authorName || r.authorName,
                    authorAvatarUrl: res.authorAvatarUrl || r.authorAvatarUrl,
                  }
                : r,
            ),
          };
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user?.id, product?.id]);

  if (error) {
    const missing = /not found|404/i.test(error);
    if (missing) {
      return (
        <div className="page-wrap not-found">
          <nav className="breadcrumbs breadcrumbs--pdp" aria-label="Breadcrumb">
            <Link className="breadcrumbs__home" to="/" aria-label="Home">
              <img src="/icons/home.svg" alt="" width={16} height={16} />
            </Link>
            <span className="breadcrumbs__sep">/</span>
            <Link to="/products">Catalog</Link>
            <span className="breadcrumbs__sep">/</span>
            <span>Not found</span>
          </nav>
          <div className="not-found__panel">
            <p className="not-found__code" aria-hidden="true">
              404
            </p>
            <h1 className="not-found__title">Product not found</h1>
            <p className="not-found__text">
              This product is unavailable or the link is outdated. Browse the catalog for similar
              items.
            </p>
            <div className="not-found__actions">
              <Link className="btn btn-primary" to="/products">
                Browse catalog
              </Link>
              <Link className="btn btn-outline" to="/">
                Go to home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return <div className="empty-state">{error}</div>;
  }
  if (!product) return <div className="empty-state">Loading…</div>;

  const images = product.images?.length ? product.images : [];
  const mainItem = images[active];
  const main = mainItem?.url;
  const mainIsVideo = Boolean(mainItem?.isVideo);
  const photoUrls = images.filter((img) => !img.isVideo).map((img) => img.url);
  const discount =
    product.discountPercent ??
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const ratingRounded = Math.round(product.averageRating);
  const priceWhole = Math.floor(product.price);
  const priceCents = Math.round((product.price - priceWhole) * 100)
    .toString()
    .padStart(2, "0");
  const oos = product.status === "OutOfStock";

  const reviews: ProductReview[] = product.reviews ?? [];
  const filteredBase = ratingFilter
    ? reviews.filter((r) => r.rating === Number(ratingFilter))
    : reviews;
  const filteredByTag = tagFilter
    ? filteredBase.filter((r) => r.tags.some((t) => t.toLowerCase() === tagFilter.toLowerCase()))
    : filteredBase;
  const filtered = [...filteredByTag].sort((a, b) => {
    if (reviewSort === "rating_desc") return b.rating - a.rating;
    if (reviewSort === "rating_asc") return a.rating - b.rating;
    return new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime();
  });
  const visibleReviews = filtered.slice(0, reviewsVisible);
  const totalReviews = Math.max(1, reviews.length);
  const distribution: Record<number, number> =
    reviews.length === 0 && product.reviewCount > 0
      ? { 5: 65, 4: 16, 3: 10, 2: 4, 1: 5 }
      : Object.fromEntries(
          [5, 4, 3, 2, 1].map((star) => [
            star,
            Math.round((100 * reviews.filter((r) => r.rating === star).length) / totalReviews),
          ]),
        );
  const frequentTags = Object.entries(
    reviews.flatMap((r) => r.tags).reduce<Record<string, number>>((acc, t) => {
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  const reviewKey = (r: ProductReview, i: number) =>
    `${r.authorName}-${r.createdAtUtc}-${r.title}-${i}`;

  const shift = (dir: -1 | 1) => {
    if (!images.length) return;
    setActive((i) => (i + dir + images.length) % images.length);
  };

  const addToCart = async (buyNow?: boolean) => {
    await add(product.id, qty);
    setMsg("Added to cart");
    if (buyNow) window.location.href = "/cart";
  };

  const notifyWhenAvailable = async () => {
    setNotifyBusy(true);
    try {
      let email = user?.email?.trim() || "";
      if (!email) {
        const entered = window.prompt("Enter your email to get notified when this item is back:");
        if (!entered?.trim()) {
          setNotifyBusy(false);
          return;
        }
        email = entered.trim();
      }
      const res = await productsApi.notifyWhenAvailable(product.id, email);
      setMsg(
        res.alreadySubscribed
          ? `Already subscribed: ${res.email}`
          : `We'll notify ${res.email} when it's back`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not subscribe");
    } finally {
      setNotifyBusy(false);
    }
  };

  const submitReview = async (payload: {
    rating: number;
    title: string;
    body: string;
    tags: string[];
    photos: string[];
  }) => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/products/${product!.id}` } } });
      return;
    }
    setReviewBusy(true);
    setReviewError(null);
    try {
      const created = await reviewsApi.create(product!.id, {
        rating: payload.rating,
        title: payload.title,
        body: payload.body,
        tags: payload.tags,
        imageUrls: payload.photos,
      });
      setProduct({
        ...product!,
        reviewCount:
          typeof created.isApproved === "boolean" && created.isApproved
            ? product!.reviewCount + 1
            : product!.reviewCount,
        reviews: [
          {
            userId: created.userId,
            authorName: resolveReviewAuthor(created.authorName, user, created.userId),
            authorAvatarUrl:
              created.authorAvatarUrl ||
              (user?.avatar && !user.avatar.startsWith("/api/") ? user.avatar : null),
            rating: created.rating,
            title: created.title,
            body: created.body,
            createdAtUtc: created.createdAtUtc,
            tags: created.tags ?? [],
            images: created.images?.length ? created.images : payload.photos,
          },
          ...(product!.reviews ?? []),
        ],
      });
      setShowReviewForm(false);
      setMsg("Review published");
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 409) {
        setReviewError("You already left a review for this product.");
      } else if (status === 401) {
        setReviewError("Please sign in again (regular account is enough — Admin is not required).");
      } else {
        setReviewError(e instanceof Error ? e.message : "Could not submit review");
      }
    } finally {
      setReviewBusy(false);
    }
  };

  const setRating = (star?: number) => {
    const next = new URLSearchParams(searchParams);
    if (!star) next.delete("rating");
    else next.set("rating", String(star));
    setSearchParams(next, { replace: true });
    setReviewsVisible(3);
  };

  return (
    <div className="page-wrap pdp-page" data-figma="2548:9286">
      <nav className="breadcrumbs breadcrumbs--pdp" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumbs__home" aria-label="Home">
          <img src="/icons/home.svg" alt="" width={16} height={16} />
        </Link>
        <span className="breadcrumbs__sep">/</span>
        <Link to={`/products?categoryId=${product.category.id}`}>{product.category.name}</Link>
        <span className="breadcrumbs__sep">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="pdp-gallery__main">
            {discount != null && discount > 0 && (
              <span className="badge badge-discount pdp-gallery__badge">-{discount}%</span>
            )}
            <button type="button" className="pdp-gallery__nav pdp-gallery__nav--prev" aria-label="Previous image" onClick={() => shift(-1)}>
              <img src="/icons/carousel-prev.svg" alt="" width={24} height={24} />
            </button>
            {main ? (
              mainIsVideo ? (
                <div className="pdp-gallery__video-wrap">
                  <video
                    key={main}
                    className="pdp-gallery__video"
                    src={main}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={`${product.name} video`}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="pdp-gallery__open"
                  aria-label="Open photo"
                  onClick={() => {
                    const photoIndex = Math.max(0, photoUrls.indexOf(main));
                    setLightbox({
                      images: photoUrls,
                      index: photoIndex,
                      alt: product.name,
                    });
                  }}
                >
                  <img src={main} alt={product.name} />
                </button>
              )
            ) : (
              <div className="img-placeholder large" />
            )}
            <button type="button" className="pdp-gallery__nav pdp-gallery__nav--next" aria-label="Next image" onClick={() => shift(1)}>
              <img src="/icons/carousel-next.svg" alt="" width={24} height={24} />
            </button>
          </div>
          <div className="pdp-gallery__thumbs">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className={`thumb ${i === active ? "active" : ""} ${img.isVideo ? "thumb--video" : ""}`}
                onClick={() => setActive(i)}
                onDoubleClick={() => {
                  if (img.isVideo || photoUrls.length === 0) return;
                  const photoIndex = Math.max(0, photoUrls.indexOf(img.url));
                  setLightbox({
                    images: photoUrls,
                    index: photoIndex,
                    alt: product.name,
                  });
                }}
              >
                {img.isVideo ? (
                  <span className="thumb__video" aria-label="Video">
                    <span className="thumb__video-icon" aria-hidden>
                      ▶
                    </span>
                  </span>
                ) : (
                  <img src={img.url} alt="" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-info">
          <h1>{product.name}</h1>
          <div className="pdp-meta">
            <div className="pdp-meta__rating">
              <span className="stars-row">
                {Array.from({ length: 5 }, (_, s) => (
                  <span key={s} className={s < ratingRounded ? "on" : "off"}>
                    ★
                  </span>
                ))}
              </span>
              <strong>{ratingRounded}</strong>
              <span>{product.reviewCount.toLocaleString()} reviews</span>
            </div>
            <span className="pdp-meta__code">Code: {product.sku}</span>
          </div>

          <div className="about-list">
            <h2 className="about-list__title">About product</h2>
            {product.aboutItems.length === 0 ? (
              <details className="about-item" open>
                <summary>Description</summary>
                <p>{product.description}</p>
              </details>
            ) : (
              product.aboutItems.map((a, i) => (
                <details key={i} className="about-item" open={i < 2}>
                  <summary>{a.title}</summary>
                  <p>{a.description}</p>
                </details>
              ))
            )}
          </div>
        </div>

        <aside className="pdp-buy">
          {msg && <div className="alert alert-ok">{msg}</div>}
          <div className="pdp-buy__price">
            <span className="pdp-price">
              $ {priceWhole}
              <sup>{priceCents}</sup>
            </span>
            {product.oldPrice != null && product.oldPrice > product.price && (
              <s>${product.oldPrice.toFixed(2)}</s>
            )}
          </div>
          <div className="buy-row">
            <span>Status</span>
            <span className={oos ? "status-oos" : "status-ok"}>{oos ? "Out of stock" : "In stock"}</span>
          </div>
          {(
            [
              ["delivery", "Delivery"],
              ["payment", "Payment methods"],
              ["security", "Security"],
              ["returns", "Returns"],
              ["seller", "About seller"],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              className="buy-link"
              onClick={() => setInfoKind(kind)}
            >
              {label} <span aria-hidden="true">›</span>
            </button>
          ))}
          {oos ? (
            <button
              className="btn btn-primary pdp-buy__btn"
              type="button"
              disabled={notifyBusy}
              onClick={() => void notifyWhenAvailable()}
            >
              {notifyBusy ? "Subscribing…" : "Notify when available"}
            </button>
          ) : (
            <div className="pdp-buy__form">
              <div className="qty-row">
                <span>Quantity</span>
                <div className="qty-control">
                  <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, product.stockQuantity)}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <button
                    type="button"
                    aria-label="Increase"
                    onClick={() => setQty((q) => Math.min(Math.max(1, product.stockQuantity), q + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
              <button className="btn btn-buy-now pdp-buy__btn" type="button" onClick={() => void addToCart(true)}>
                Buy now
              </button>
              <button className="btn btn-add-cart pdp-buy__btn" type="button" onClick={() => void addToCart(false)}>
                Add to cart
              </button>
              <button
                className="pdp-wishlist"
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                    return;
                  }
                  const wasIn = has(product.id);
                  void toggle(product.id).then(() =>
                    setMsg(wasIn ? "Removed from wishlist" : "Added to wishlist"),
                  );
                }}
              >
                {user && has(product.id) ? "Remove from wish list" : "Add to wish list"}
              </button>
            </div>
          )}
        </aside>
      </div>

      {product.attributes.length > 0 && (
        <section className="pdp-section pdp-details">
          <h2>Product details</h2>
          <div className="pdp-details__grid">
            {product.attributes.map((a, i) => (
              <div key={i} className="pdp-details__item">
                <strong>{a.name}</strong>
                <span>{a.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pdp-section pdp-reviews" id="reviews">
        <h2>Customer reviews</h2>
        <div className="pdp-reviews__layout">
          <aside className="pdp-reviews__aside">
            <div className="reviews-score-card">
              <div className="reviews-score-card__top">
                <strong>{ratingRounded}/5</strong>
                <span className="stars-row">
                  {Array.from({ length: 5 }, (_, s) => (
                    <span key={s} className={s < ratingRounded ? "on" : "off"}>
                      ★
                    </span>
                  ))}
                </span>
                <span className="reviews-score-card__count">
                  {product.reviewCount.toLocaleString()} reviews
                </span>
              </div>
              <ul className="rating-bars" aria-label="Rating distribution">
                {[5, 4, 3, 2, 1].map((star) => (
                  <li key={star}>
                    <span>{star}</span>
                    <span className="rating-bars__track">
                      <span className="rating-bars__fill" style={{ width: `${distribution[star] ?? 0}%` }} />
                    </span>
                    <span>{distribution[star] ?? 0}%</span>
                  </li>
                ))}
              </ul>
              <p className="reviews-confirmed">
                <span aria-hidden="true">✓</span> All opinions confirmed by purchase{" "}
                <Link to="/terms">Learn more ›</Link>
              </p>
            </div>
            {frequentTags.length > 0 && (
              <div className="frequent-tags">
                <h3>Frequent tags</h3>
                <div className="frequent-tags__list">
                  {frequentTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`tag tag--soft${tagFilter === t ? " is-active" : ""}`}
                      onClick={() => {
                        setTagFilter((cur) => (cur === t ? null : t));
                        setReviewsVisible(3);
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="pdp-reviews__main">
            <div className="reviews-toolbar">
              <div className="reviews-filters">
                <button type="button" className={`chip ${!ratingFilter ? "is-active" : ""}`} onClick={() => setRating()}>
                  All
                </button>
                {[5, 4, 3, 2, 1].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`chip ${ratingFilter === String(star) ? "is-active" : ""}`}
                    onClick={() => setRating(star)}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
              <label className="reviews-sort">
                <select
                  aria-label="Sort reviews"
                  value={reviewSort}
                  onChange={(e) => {
                    setReviewSort(e.target.value as typeof reviewSort);
                    setReviewsVisible(3);
                  }}
                >
                  <option value="recent">Most recent</option>
                  <option value="rating_desc">Highest rating</option>
                  <option value="rating_asc">Lowest rating</option>
                </select>
              </label>
            </div>

            <button type="button" className="btn btn-create-review" onClick={() => setShowReviewForm(true)}>
              + Create review
            </button>

            {filtered.length === 0 ? (
              <p className="empty-state">No reviews yet.</p>
            ) : (
              <>
                <div className="review-list">
                  {visibleReviews.map((r, i) => {
                    const key = reviewKey(r, i);
                    const helpfulCount = helpful[key] ?? r.totalHelpful ?? 0;
                    const gradeBusy = !!helpfulBusy[key];
                    const showingUk = !!reviewShowUk[key];
                    const uk = reviewTranslations[key];
                    const busy = !!translateBusy[key];
                    const titleText = showingUk && uk ? uk.title || r.title : r.title;
                    const bodyText = showingUk && uk ? uk.body || r.body : r.body;
                    return (
                      <article key={key} className="review-card">
                        <div className="review-card__head">
                          <div className="review-card__author">
                            <ReviewAvatar review={r} user={user} />
                            <strong>{resolveReviewAuthor(r.authorName, user, r.userId)}</strong>
                          </div>
                          <time>{new Date(r.createdAtUtc).toLocaleDateString()}</time>
                        </div>
                        <div className="stars-row">
                          {Array.from({ length: 5 }, (_, s) => (
                            <span key={s} className={s < r.rating ? "on" : "off"}>
                              ★
                            </span>
                          ))}
                        </div>
                        <h3>{titleText}</h3>
                        <p>{bodyText}</p>
                        {showingUk && (
                          <p className="review-card__lang-note">Translated to Ukrainian</p>
                        )}
                        {r.tags.length > 0 && (
                          <div className="review-card__tags">
                            {r.tags.map((t) => (
                              <span key={t} className="tag tag--soft">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {r.images?.length > 0 && (
                          <div className="review-card__photos">
                            {r.images.map((url, photoIdx) => (
                              <button
                                key={url}
                                type="button"
                                className="review-card__photo-btn"
                                aria-label="Open review photo"
                                onClick={() =>
                                  setLightbox({
                                    images: r.images,
                                    index: photoIdx,
                                    alt: `Review by ${resolveReviewAuthor(r.authorName, user, r.userId)}`,
                                  })
                                }
                              >
                                <img src={url} alt="" width={72} height={72} />
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="review-card__actions">
                          <div className="review-card__btns">
                            <button
                              type="button"
                              className={`btn btn-helpful${myHelpful[key] ? " is-active" : ""}`}
                              disabled={gradeBusy}
                              aria-busy={gradeBusy}
                              onClick={async () => {
                                if (!user) {
                                  navigate("/login", { state: { from: `/products/${product.id}` } });
                                  return;
                                }
                                if (!r.id) {
                                  setMsg("Review id missing — reload the page.");
                                  return;
                                }
                                setHelpfulBusy((prev) => ({ ...prev, [key]: true }));
                                setMsg(null);
                                const beforeVoted = !!myHelpful[key];
                                const beforeCount = helpful[key] ?? r.totalHelpful ?? 0;
                                try {
                                  await reviewsApi.grade(r.id);
                                  let voted = !beforeVoted;
                                  try {
                                    const mine = await reviewsApi.myGrade(r.id);
                                    voted = !!(mine.isHelpful ?? mine.IsHelpful);
                                  } catch {
                                    /* 404 = no grade row; treat as not helpful */
                                    voted = false;
                                  }
                                  const nextCount = Math.max(
                                    0,
                                    beforeCount + (voted === beforeVoted ? 0 : voted ? 1 : -1),
                                  );
                                  setMyHelpful((prev) => ({ ...prev, [key]: voted }));
                                  setHelpful((prev) => ({ ...prev, [key]: nextCount }));
                                  setProduct((prev) => {
                                    if (!prev?.reviews) return prev;
                                    return {
                                      ...prev,
                                      reviews: prev.reviews.map((rev) =>
                                        rev.id === r.id ? { ...rev, totalHelpful: nextCount } : rev,
                                      ),
                                    };
                                  });
                                } catch (e) {
                                  if (e instanceof ApiError && e.status === 401) {
                                    navigate("/login", { state: { from: `/products/${product.id}` } });
                                    return;
                                  }
                                  setMsg(e instanceof Error ? e.message : "Could not mark helpful");
                                } finally {
                                  setHelpfulBusy((prev) => ({ ...prev, [key]: false }));
                                }
                              }}
                            >
                              Helpful
                            </button>
                            <button
                              type="button"
                              className={`btn btn-translate${showingUk ? " is-active" : ""}`}
                              disabled={busy}
                              aria-busy={busy}
                              onClick={async () => {
                                setMsg(null);
                                if (showingUk) {
                                  setReviewShowUk((prev) => ({ ...prev, [key]: false }));
                                  return;
                                }
                                if (uk) {
                                  setReviewShowUk((prev) => ({ ...prev, [key]: true }));
                                  return;
                                }
                                setTranslateBusy((prev) => ({ ...prev, [key]: true }));
                                try {
                                  const next = await translateReviewToUkrainian(
                                    r.title ?? "",
                                    r.body ?? "",
                                  );
                                  setReviewTranslations((prev) => ({ ...prev, [key]: next }));
                                  setReviewShowUk((prev) => ({ ...prev, [key]: true }));
                                } catch (e) {
                                  setMsg(
                                    e instanceof Error
                                      ? e.message
                                      : "Could not translate this review",
                                  );
                                } finally {
                                  setTranslateBusy((prev) => ({ ...prev, [key]: false }));
                                }
                              }}
                            >
                              {busy ? "Translating…" : showingUk ? "Show original" : "Translate"}
                            </button>
                          </div>
                          {helpfulCount > 0 && (
                            <span className="review-card__helpful-note">
                              {helpfulCount === 1
                                ? "1 person found this helpful"
                                : `${helpfulCount} people found this helpful`}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
                {reviewsVisible < filtered.length && (
                  <div className="reviews-more">
                    <button
                      type="button"
                      className="btn btn-see-more"
                      onClick={() => setReviewsVisible((n) => n + 3)}
                    >
                      See more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {infoKind && (
        <PdpInfoModal kind={infoKind} onClose={() => setInfoKind(null)} onChange={setInfoKind} />
      )}

      {showReviewForm && (
        <CreateReviewModal
          productId={product.id}
          signedIn={!!user}
          busy={reviewBusy}
          error={reviewError}
          onClose={() => {
            setShowReviewForm(false);
            setReviewError(null);
          }}
          onSubmit={submitReview}
        />
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((prev) => (prev ? { ...prev, index: i } : prev))}
        />
      )}

      <ProductCarousel
        items={product.related ?? []}
        title={`More ${product.category.name.toLowerCase()}`}
        seeAllTo={`/products?categoryId=${product.category.id}`}
      />
      <ProductCarousel
        items={product.saleRelated ?? []}
        title={`${product.category.name}: sale`}
        seeAllTo={`/products?categoryId=${product.category.id}&sort=rating_desc`}
      />
    </div>
  );
}
