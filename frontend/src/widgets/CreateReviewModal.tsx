import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const TAG_OPTIONS = [
  "Actual price",
  "Fits the description",
  "High quality",
  "Worth the price",
  "Exceeds expectations",
  "Matches the photos",
];

const MAX_TITLE = 60;
const MAX_BODY = 1000;
const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  productId: string;
  signedIn: boolean;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    rating: number;
    title: string;
    body: string;
    tags: string[];
    photos: string[];
  }) => Promise<void> | void;
};

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function CreateReviewModal({ productId, signedIn, busy, error, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 6)));
  };

  const onPickPhotos = () => {
    if (photos.length >= MAX_PHOTOS || photoBusy) return;
    fileRef.current?.click();
  };

  const onFilesSelected = async (list: FileList | null) => {
    if (!list?.length) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const files = Array.from(list).slice(0, room);
      const next: string[] = [];
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
          setPhotoError("Acceptable formats: JPEG, PNG, WebP, GIF");
          continue;
        }
        if (file.size > MAX_PHOTO_BYTES) {
          setPhotoError("Maximum file size: 5 MB");
          continue;
        }
        next.push(await readAsDataUrl(file));
      }
      if (next.length) {
        setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
      }
    } catch {
      setPhotoError("Could not read photo");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const canSubmit =
    signedIn && rating >= 1 && title.trim().length > 0 && body.trim().length > 0 && !busy;

  return (
    <div className="pdp-review-backdrop" role="presentation" onClick={onClose}>
      <div
        className="pdp-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-review-title"
        data-figma="4533:27903"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="pdp-review-title">Create review</h2>
        <hr className="pdp-review-modal__rule" />

        {!signedIn && (
          <p className="pdp-review-modal__signin">
            <Link to="/login" state={{ from: { pathname: `/products/${productId}` } }}>
              Sign in
            </Link>{" "}
            to publish a review.
          </p>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div
          className="pdp-review-modal__stars"
          role="radiogroup"
          aria-label="Rating"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const on = (hover || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                className={`pdp-review-modal__star${on ? " is-on" : ""}`}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            );
          })}
        </div>

        <label className="pdp-review-field pdp-review-field--count">
          <span className="pdp-review-field__label">Title</span>
          <input
            value={title}
            maxLength={MAX_TITLE}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
            placeholder="Your opinion in a nutshell..."
          />
          <em className="pdp-review-field__counter">
            {title.length} / {MAX_TITLE}
          </em>
        </label>

        <label className="pdp-review-field pdp-review-field--area pdp-review-field--count">
          <span className="pdp-review-field__label">Description</span>
          <textarea
            rows={4}
            value={body}
            maxLength={MAX_BODY}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
            placeholder="Tell us more about your experiences..."
          />
          <em className="pdp-review-field__counter">
            {body.length} / {MAX_BODY}
          </em>
        </label>

        <div className="pdp-review-modal__tags">
          <strong>Tags</strong>
          <div className="pdp-review-modal__tag-list">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`pdp-review-modal__tag${tags.includes(tag) ? " is-active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-review-modal__photos">
          <div className="pdp-review-modal__photos-head">
            <strong>
              Photos <span title="Optional. JPEG / PNG / WebP / GIF, up to 5 MB each.">ⓘ</span>
            </strong>
            <span>
              {photos.length}/{MAX_PHOTOS}
            </span>
          </div>
          {photoError && <p className="pdp-review-modal__photo-error">{photoError}</p>}
          <div className="pdp-review-modal__photo-grid">
            {photos.map((url, i) => (
              <button
                key={`${i}-${url.slice(0, 32)}`}
                type="button"
                className="pdp-review-modal__photo"
                title="Remove"
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <img src={url} alt="" />
              </button>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                className="pdp-review-modal__photo-add"
                disabled={photoBusy}
                aria-label="Add photo"
                onClick={onPickPhotos}
              >
                {photoBusy ? "…" : "+"}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            hidden
            onChange={(e) => void onFilesSelected(e.target.files)}
          />
        </div>

        <div className="pdp-review-modal__actions">
          <button type="button" className="pdp-review-modal__btn pdp-review-modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="pdp-review-modal__btn pdp-review-modal__btn--primary"
            disabled={!canSubmit}
            onClick={() =>
              void onSubmit({
                rating,
                title: title.trim(),
                body: body.trim(),
                tags,
                photos,
              })
            }
          >
            {busy ? "…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
