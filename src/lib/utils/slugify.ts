/**
 * Turns a human-typed title into a URL-safe slug. Not guaranteed unique on
 * its own — callers that need uniqueness (store/product creation) append a
 * short random suffix, since round-tripping to the DB to check for
 * collisions isn't worth it at this scale.
 */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return base || "item";
}

/** A short random suffix, e.g. "a1b2c3" — enough to keep slugs unique in practice. */
export function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${randomSlugSuffix()}`;
}
