/** Resolve URL exibível de capa/mídia (disco local, Blob ou data URL). */
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
  return `/api/media/${pathOrUrl.replace(/^\/+/, "")}`;
}
