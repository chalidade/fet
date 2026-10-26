import { fileURLToPath } from "node:url";
import { readConcepts, type ConceptData } from "@chalidade/learn-theme/node";
import { stages } from "./stages";

// Daftar konsep (item "- [ ]") per tahap untuk halaman Bukti Belajar.
declare const data: ConceptData;
export { data };

export default {
  watch: ["../roadmap/*.md", "../en/roadmap/*.md"],
  load(): ConceptData {
    const dir = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
    return readConcepts(
      { id: dir("../roadmap/"), en: dir("../en/roadmap/") },
      stages.map((s) => s.slug),
    );
  },
};
