// Draf per tahap di localStorage. Ini hanya kenyamanan per browser:
// sumber kebenaran untuk hasil belajar adalah Google Drive milik user.

export type Status = "not-started" | "in-progress" | "done";

export interface StageDraft {
  html: string;
  css: string;
  js: string;
  notes: string;
  status: Status;
  updatedAt: string;
}

const PREFIX = "fet:learning:";

export function loadDraft(slug: string): StageDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + slug);
    return raw ? (JSON.parse(raw) as StageDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(slug: string, draft: StageDraft): void {
  try {
    localStorage.setItem(PREFIX + slug, JSON.stringify(draft));
  } catch {
    // Storage penuh atau diblokir: draf tidak tersimpan, tapi halaman tetap jalan.
  }
}

export function loadAllStatuses(): Record<string, Status> {
  const out: Record<string, Status> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      const draft = JSON.parse(localStorage.getItem(key) ?? "null") as StageDraft | null;
      if (draft) out[key.slice(PREFIX.length)] = draft.status;
    }
  } catch {
    // abaikan
  }
  return out;
}

export function starter(slug: string, title: string, lang: "id" | "en"): StageDraft {
  const heading = lang === "id" ? `Latihan ${title}` : `${title} practice`;
  const notes =
    lang === "id"
      ? `# Catatan: ${title}\n\n- **Pertanyaan:** \n- **Hipotesis:** \n- **Eksperimen:** \n- **Hasil:** \n- **Kesimpulan & hal yang mengejutkan:** \n`
      : `# Notes: ${title}\n\n- **Question:** \n- **Hypothesis:** \n- **Experiment:** \n- **Result:** \n- **Conclusion & surprises:** \n`;
  return {
    html: `<main>\n  <h1>${heading}</h1>\n  <p id="output"></p>\n</main>\n`,
    css: `body {\n  font-family: system-ui, sans-serif;\n  padding: 1rem;\n}\n`,
    js: `// ${lang === "id" ? "Tulis eksperimenmu di sini" : "Write your experiment here"} (${slug})\nconst output = document.querySelector("#output");\noutput.textContent = "Hello, ${title}!";\nconsole.log("ready");\n`,
    notes,
    status: "not-started",
    updatedAt: new Date().toISOString(),
  };
}

// Centang peta konsep per tahap: daftar nomor item (data-task) yang sudah dikuasai.
const CHECK_PREFIX = "fet:checklist:";

export function loadChecklist(slug: string): number[] {
  try {
    const raw = localStorage.getItem(CHECK_PREFIX + slug);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((n): n is number => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

export function saveChecklist(slug: string, checked: number[]): void {
  try {
    localStorage.setItem(CHECK_PREFIX + slug, JSON.stringify(checked));
  } catch {
    // abaikan
  }
}
