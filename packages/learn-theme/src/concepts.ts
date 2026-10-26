import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ConceptData } from "./lib/config";

export type { ConceptData };

// Hanya untuk Node (data loader VitePress): membaca item "- [ ]" per tahap dalam urutan
// yang sama dengan nomor data-task dari plugin taskList.
export function readConceptList(path: string): string[] {
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

/** Baca konsep semua tahap dari `<dir.id>/<slug>.md` dan `<dir.en>/<slug>.md`. */
export function readConcepts(dir: { id: string; en: string }, slugs: readonly string[]): ConceptData {
  const result: ConceptData = { id: {}, en: {} };
  for (const slug of slugs) {
    result.id[slug] = readConceptList(join(dir.id, `${slug}.md`));
    result.en[slug] = readConceptList(join(dir.en, `${slug}.md`));
  }
  return result;
}
