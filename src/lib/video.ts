/** Only known video hosts and exact identifiers can enter the exercise catalog. */
export function videoEmbedUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    if (host === "www.youtube.com" || host === "youtube.com" || host === "www.youtube-nocookie.com") {
      id = url.pathname === "/watch" ? url.searchParams.get("v") : url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : null;
    }
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    if ((host === "vimeo.com" || host === "www.vimeo.com") && /^\/[0-9]{5,12}$/.test(url.pathname)) return `https://player.vimeo.com/video/${url.pathname.slice(1)}`;
    return null;
  } catch { return null; }
}
