import MarkdownIt from "markdown-it";

// html: false → tag HTML di input di-escape, sehingga aman dari XSS.
// markdown-it juga menolak link berbahaya (javascript:, vbscript:, data: non-gambar).
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const defaultLink =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx]!.attrSet("target", "_blank");
  tokens[idx]!.attrSet("rel", "noopener noreferrer nofollow");
  return defaultLink(tokens, idx, options, env, self);
};

export function renderMarkdown(src: string): string {
  return md.render(src);
}

/** Ubah link Google Drive / YouTube menjadi URL embed. Selain itu: null. */
export function embedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  if (u.hostname === "drive.google.com") {
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    const id = m?.[1] ?? u.searchParams.get("id");
    return id ? `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview` : null;
  }
  if (u.hostname === "youtu.be") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
  }
  if (u.hostname.endsWith("youtube.com")) {
    const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
  }
  return null;
}
