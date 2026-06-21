/** Encode image paths for URLs (handles spaces in folder/file names) */
export function toImageUrl(relativePath: string): string {
  const parts = relativePath.replace(/\\/g, '/').split('/')
  return '/images/' + parts.map((p) => encodeURIComponent(p)).join('/')
}
