const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8155';

/**
 * Resolves an image field value that may be either a plain URL string
 * (legacy / externally sourced) or a Directus file UUID (when uploaded via Directus admin).
 */
export function resolveImageUrl(value: string | null | undefined): string {
  if (!value) return '';
  if (UUID_RE.test(value.trim())) {
    return `${DIRECTUS_URL}/assets/${value.trim()}`;
  }
  return value;
}
