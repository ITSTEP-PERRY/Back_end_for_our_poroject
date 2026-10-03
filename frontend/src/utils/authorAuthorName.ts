const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Auth JWT NameClaimType=sub — Product sometimes stored userId as AuthorName. */
export function formatAuthorName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed || GUID_RE.test(trimmed)) return "Customer";
  return trimmed;
}

/** Prefer current user's display name when the stored author is their userId. */
export function resolveReviewAuthor(
  authorName: string | null | undefined,
  currentUser?: { id?: string; name?: string; email?: string } | null,
): string {
  const trimmed = (authorName ?? "").trim();
  if (
    currentUser?.id &&
    trimmed &&
    trimmed.toLowerCase() === currentUser.id.toLowerCase()
  ) {
    const mine = (currentUser.name || currentUser.email || "").trim();
    if (mine && !GUID_RE.test(mine)) return mine;
  }
  return formatAuthorName(trimmed);
}

export function authorInitial(
  name: string | null | undefined,
  currentUser?: { id?: string; name?: string; email?: string } | null,
): string {
  return resolveReviewAuthor(name, currentUser).charAt(0).toUpperCase() || "?";
}
