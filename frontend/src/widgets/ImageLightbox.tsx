import { useEffect, useCallback, type MouseEvent } from "react";

type Props = {
  images: string[];
  index: number;
  alt?: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function ImageLightbox({ images, index, alt = "", onClose, onIndexChange }: Props) {
  const count = images.length;
  const safeIndex = count === 0 ? 0 : ((index % count) + count) % count;
  const src = images[safeIndex];

  const shift = useCallback(
    (dir: -1 | 1) => {
      if (count <= 1) return;
      onIndexChange((safeIndex + dir + count) % count);
    },
    [count, onIndexChange, safeIndex],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") shift(-1);
      if (e.key === "ArrowRight") shift(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, shift]);

  if (!src) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div
      className="lightbox-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Photo viewer"
        onClick={stop}
      >
        <button type="button" className="lightbox__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {count > 1 && (
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            aria-label="Previous image"
            onClick={() => shift(-1)}
          >
            <img src="/icons/carousel-prev.svg" alt="" width={24} height={24} />
          </button>
        )}
        <img className="lightbox__img" src={src} alt={alt} />
        {count > 1 && (
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            aria-label="Next image"
            onClick={() => shift(1)}
          >
            <img src="/icons/carousel-next.svg" alt="" width={24} height={24} />
          </button>
        )}
        {count > 1 && (
          <p className="lightbox__counter" aria-live="polite">
            {safeIndex + 1} / {count}
          </p>
        )}
      </div>
    </div>
  );
}
