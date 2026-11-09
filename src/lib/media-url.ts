/** Resolve URL exibível de capa/mídia (disco, Azure, Blob público ou data URL). */
export function mediaSrc(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("blob:")
  ) {
    return pathOrUrl;
  }
  const relative = pathOrUrl.replace(/^azure:/, "").replace(/^\/+/, "");
  return `/api/media/${relative}`;
}
