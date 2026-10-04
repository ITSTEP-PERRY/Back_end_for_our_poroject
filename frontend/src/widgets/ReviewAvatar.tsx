import { useEffect, useState } from "react";
import { authApi } from "../api";
import type { AuthUser } from "../api/types";
import {
  authorInitial,
  isOwnReview,
  resolveReviewAvatar,
} from "../utils/reviewAuthor";

type ReviewLike = {
  userId?: string;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
};

type Props = {
  review: ReviewLike;
  user?: AuthUser | null;
};

/**
 * Figma review avatar: profile photo when available, otherwise name initial.
 * Own reviews hydrate Auth avatar (Bearer) when Product has no authorAvatarUrl yet.
 */
export function ReviewAvatar({ review, user }: Props) {
  const [src, setSrc] = useState<string | null>(() => resolveReviewAvatar(review, user));

  useEffect(() => {
    let cancelled = false;
    const immediate = resolveReviewAvatar(review, user);
    if (immediate) {
      setSrc(immediate);
      return;
    }
    if (!isOwnReview(review, user)) {
      setSrc(null);
      return;
    }
    void authApi
      .loadAvatarBlobUrl()
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
    };
  }, [review.userId, review.authorName, review.authorAvatarUrl, user?.id, user?.avatar, user?.name]);

  if (src) {
    return (
      <img
        className="review-avatar review-avatar--photo"
        src={src}
        alt=""
        width={36}
        height={36}
      />
    );
  }

  return (
    <span className="review-avatar" aria-hidden="true">
      {authorInitial(review.authorName, user, review.userId)}
    </span>
  );
}
