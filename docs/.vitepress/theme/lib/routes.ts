import { withBase } from "vitepress";

export type Lang = "id" | "en";

export function langOf(vpLang: string): Lang {
  return vpLang.startsWith("en") ? "en" : "id";
}

/** Path halaman komunitas per bahasa (tanpa base). */
export function paths(lang: Lang) {
  const en = lang === "en";
  const p = en ? "/en" : "";
  return {
    room: (stage?: string) => `${p}/${en ? "learning-room" : "ruang-belajar"}${stage ? `?tahap=${stage}` : ""}`,
    community: (stage?: string) => `${p}/${en ? "community" : "komunitas"}/${stage ? `?tahap=${stage}` : ""}`,
    post: (id: string) => `${p}/${en ? "community" : "komunitas"}/post?id=${id}`,
    profile: (username?: string) => `${p}/${en ? "profile" : "profil"}${username ? `?u=${encodeURIComponent(username)}` : ""}`,
    stage: (slug: string) => `${p}/roadmap/${slug}`,
    evidence: (username?: string) => `${p}/${en ? "evidence" : "bukti-belajar"}${username ? `?u=${encodeURIComponent(username)}` : ""}`,
  };
}

export function href(path: string): string {
  return withBase(path);
}

export function query(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}
