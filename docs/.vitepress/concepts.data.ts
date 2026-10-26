import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stages } from "./stages";

// Daftar konsep (item "- [ ]") per tahap, dalam urutan yang sama dengan nomor data-task
// dari taskList.ts. Dipakai halaman Bukti Belajar untuk menampilkan konsep yang dicentang.
export interface ConceptData {
  id: Record<string, string[]>;
  en: Record<string, string[]>;
}

declare const data: ConceptData;
export { data };

function read(path: string): string[] {
  const out: string[] = [];
  let fenced = false;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^\s*[-*+]\s+\[[ xX]\]\s+(.*)$/.exec(line);
    if (m) out.push(m[1]!.trim());
  }
  return out;
}

export default {
  watch: ["../roadmap/*.md", "../en/roadmap/*.md"],
  load(): ConceptData {
    const file = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
    const result: ConceptData = { id: {}, en: {} };
    for (const st of stages) {
      result.id[st.slug] = read(file(`../roadmap/${st.slug}.md`));
      result.en[st.slug] = read(file(`../en/roadmap/${st.slug}.md`));
    }
    return result;
  },
};
