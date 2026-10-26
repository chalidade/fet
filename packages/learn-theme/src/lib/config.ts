// Konfigurasi situs yang memakai tema ini (daftar tahap, fase, konsep, nama situs).
// Diisi sekali oleh createLearnTheme sebelum aplikasi dirender, termasuk saat SSR.

export interface StageInfo {
  slug: string;
  title: string;
}

export interface PhaseInfo {
  id: string;
  en: string;
  /** Indeks [awal, akhir) di `stages`. */
  range: [number, number];
}

/** Daftar konsep (item "- [ ]") per tahap, per bahasa. */
export interface ConceptData {
  id: Record<string, string[]>;
  en: Record<string, string[]>;
}

export interface LearnConfig {
  /** Nama situs, dipakai di teks seperti "Dibuat dari data fet". */
  siteName: string;
  /** Bidang yang dipelajari, misalnya { id: "front-end", en: "front-end" }. */
  subject: { id: string; en: string };
  stages: readonly StageInfo[];
  phases: readonly PhaseInfo[];
  concepts: ConceptData;
}

export const config: LearnConfig = {
  siteName: "fet",
  subject: { id: "front-end", en: "front-end" },
  stages: [],
  phases: [],
  concepts: { id: {}, en: {} },
};

export function configure(options: Partial<LearnConfig>): void {
  Object.assign(config, options);
}

export function findStage(slug: string | null | undefined): StageInfo | undefined {
  return config.stages.find((s) => s.slug === slug);
}

/** Nomor tahap untuk ditampilkan: "04-javascript" → "04", "be-01-http" → "01". */
export function stageNumber(slug: string): string {
  return /(?:^|-)(\d{2})-/.exec(slug)?.[1] ?? slug.slice(0, 2);
}
