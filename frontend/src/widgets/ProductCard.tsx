import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../api/media";
import type { ProductListItem } from "../api/types";

export function ProductCard({ product }: { product: ProductListItem }) {
  const discount =
    product.discountPercent ??
    (product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null);
  const oos = String(product.status) === "OutOfStock" || String(product.status) === "2";
  const imageUrl = resolveMediaUrl(product.imageUrl);
  const rating = Math.round(product.averageRating || 0);

  return (
    <Link className={`product-card ${oos ? "is-oos" : ""}`} to={`/products/${product.id}`}>
      <div className="product-card__media">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="img-placeholder" />
        )}
        {discount != null && discount > 0 && (
          <span className="badge badge-discount">- {discount}%</span>
        )}
        {oos && (
          <>
            <span className="badge badge-oos">Out of stock</span>
            <div className="product-card__oos-actions">
              <button type="button" className="btn btn-ghost btn-sm notify-btn" disabled>
                Notify when available
              </button>
            </div>
          </>
        )}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">{product.name}</h3>
        <div className="product-card__rating">
          <img className="rating-icon" src="/icons/star.svg" alt="" width={18} height={18} />
          <span>{rating}</span>
          <img className="rating-icon" src="/icons/reviews.svg" alt="" width={18} height={18} />
          <span>{product.reviewCount.toLocaleString()}</span>
        </div>
        <div className="product-card__price">
          <strong>$ {product.price.toFixed(2)}</strong>
          {product.oldPrice != null && product.oldPrice > product.price && (
            <span className="product-card__price-old">$ {product.oldPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
