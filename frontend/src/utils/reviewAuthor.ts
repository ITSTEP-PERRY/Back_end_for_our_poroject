const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

type ReviewAuthorUser = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string | null;
} | null;

function looksLikeEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

function usableProfileName(user?: ReviewAuthorUser): string | null {
  const name = (user?.name || "").trim();
  if (!name || GUID_RE.test(name) || looksLikeEmail(name)) return null;
  return name;
}

/** Auth JWT NameClaimType=sub — Product sometimes stored userId as AuthorName. */
export function formatAuthorName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed || GUID_RE.test(trimmed)) return "Customer";
  return trimmed;
}

function belongsToCurrentUser(
  authorName: string,
  reviewUserId: string | undefined,
  currentUser?: ReviewAuthorUser,
): boolean {
  if (!currentUser) return false;
  if (
    currentUser.id &&
    reviewUserId &&
    reviewUserId.toLowerCase() === currentUser.id.toLowerCase()
  ) {
    return true;
  }
  const author = authorName.trim();
  if (!author) return false;
  if (currentUser.id && author.toLowerCase() === currentUser.id.toLowerCase()) return true;
  const email = (currentUser.email || "").trim().toLowerCase();
  if (email && author.toLowerCase() === email) return true;
  const name = usableProfileName(currentUser)?.toLowerCase();
  if (name && author.toLowerCase() === name) return true;
  return false;
}

/**
 * Label on the review card.
 * Own reviews always prefer the live profile name — never a stored email/GUID snapshot.
 */
export function resolveReviewAuthor(
  authorName: string | null | undefined,
  currentUser?: ReviewAuthorUser,
  reviewUserId?: string,
): string {
  const trimmed = (authorName ?? "").trim();
  const profileName = usableProfileName(currentUser);

  if (profileName && belongsToCurrentUser(trimmed, reviewUserId, currentUser)) {
    return profileName;
  }

  // Stored email for someone else — keep as-is (or Customer if empty/guid).
  if (GUID_RE.test(trimmed) || !trimmed) return "Customer";
  return trimmed;
}

export function authorInitial(
  name: string | null | undefined,
  currentUser?: ReviewAuthorUser,
  reviewUserId?: string,
): string {
  return resolveReviewAuthor(name, currentUser, reviewUserId).charAt(0).toUpperCase() || "?";
}

function isDisplayableAvatarUrl(url?: string | null): boolean {
  if (!url) return false;
  if (/^(https?:|blob:|data:)/i.test(url)) return true;
  if (url.startsWith("/uploads")) return true;
  return false;
}

export function isOwnReview(
  review: { userId?: string; authorName?: string | null },
  currentUser?: ReviewAuthorUser,
): boolean {
  return belongsToCurrentUser(review.authorName ?? "", review.userId, currentUser);
}

/**
 * Profile photo on the review card (Figma).
 * Prefer stored authorAvatarUrl; for the viewer's own review use live profile avatar;
 * otherwise null → show initials.
 */
export function resolveReviewAvatar(
  review: { userId?: string; authorName?: string | null; authorAvatarUrl?: string | null },
  currentUser?: ReviewAuthorUser,
): string | null {
  if (isDisplayableAvatarUrl(review.authorAvatarUrl)) return review.authorAvatarUrl!;
  if (isOwnReview(review, currentUser) && isDisplayableAvatarUrl(currentUser?.avatar)) {
    return currentUser!.avatar!;
  }
  return null;
}
