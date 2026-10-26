// Penyimpanan video ke Google Drive milik user, sepenuhnya dari browser.
// Memakai Google Identity Services (token client) dengan scope drive.file:
// aplikasi hanya bisa melihat file yang dibuatnya sendiri.

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";
export const ROOT_FOLDER = "fet-belajar";

export const clientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
export const isConfigured = clientId.length > 0;

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (res: TokenResponse) => void;
            error_callback?: (err: { type: string }) => void;
          }): { requestAccessToken(opts?: { prompt?: string }): void };
        };
      };
    };
  }
}

let token: string | null = null;
let tokenExpiresAt = 0;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function isConnected(): boolean {
  return token !== null && Date.now() < tokenExpiresAt;
}

/** Minta akses Drive. Harus dipanggil dari klik user (popup). */
export async function connect(): Promise<void> {
  if (!isConfigured) throw new Error("Google Drive is not configured");
  await loadGis();
  await new Promise<void>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (res) => {
        if (res.error || !res.access_token) return reject(new Error(res.error ?? "No access token"));
        token = res.access_token;
        tokenExpiresAt = Date.now() + ((res.expires_in ?? 3600) - 60) * 1000;
        resolve();
      },
      error_callback: (err) => reject(new Error(err.type)),
    });
    client.requestAccessToken();
  });
}

async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
  if (!isConnected()) throw new Error("Drive session expired, please reconnect");
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

function q(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findChild(parentId: string | null, name: string, folder = false): Promise<DriveFile | null> {
  const parts = [`name = '${q(name)}'`, "trashed = false"];
  if (parentId) parts.push(`'${parentId}' in parents`);
  if (folder) parts.push(`mimeType = '${FOLDER_MIME}'`);
  const params = new URLSearchParams({ q: parts.join(" and "), fields: "files(id,name,webViewLink)", spaces: "drive" });
  const res = await api<{ files: DriveFile[] }>(`${API}/files?${params}`);
  return res.files[0] ?? null;
}

async function ensureFolder(parentId: string | null, name: string): Promise<DriveFile> {
  const found = await findChild(parentId, name, true);
  if (found) return found;
  return api<DriveFile>(`${API}/files?fields=id,name,webViewLink`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, ...(parentId ? { parents: [parentId] } : {}) }),
  });
}

/** Folder `fet-belajar/<slug>`, dibuat kalau belum ada. */
export async function stageFolder(slug: string): Promise<{ root: DriveFile; stage: DriveFile }> {
  const root = await ensureFolder(null, ROOT_FOLDER);
  const stage = await ensureFolder(root.id, slug);
  return { root, stage };
}

/** Buat atau timpa file teks kecil dengan nama tertentu di sebuah folder. */
export async function upsertText(folderId: string, name: string, content: string, mimeType = "text/plain"): Promise<DriveFile> {
  const existing = await findChild(folderId, name);
  if (existing) {
    return api<DriveFile>(`${UPLOAD}/files/${existing.id}?uploadType=media&fields=id,name,webViewLink`, {
      method: "PATCH",
      headers: { "Content-Type": mimeType },
      body: content,
    });
  }
  const boundary = "fet" + Math.random().toString(36).slice(2);
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name, parents: [folderId], mimeType }) +
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n` +
    content +
    `\r\n--${boundary}--`;
  return api<DriveFile>(`${UPLOAD}/files?uploadType=multipart&fields=id,name,webViewLink`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
}

/** Upload file besar (video) dengan resumable upload. Selalu membuat file baru. */
export async function uploadBlob(folderId: string, name: string, blob: Blob): Promise<DriveFile> {
  if (!isConnected()) throw new Error("Drive session expired, please reconnect");
  const init = await fetch(`${UPLOAD}/files?uploadType=resumable&fields=id,name,webViewLink`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": blob.type,
      "X-Upload-Content-Length": String(blob.size),
    },
    body: JSON.stringify({ name, parents: [folderId], mimeType: blob.type }),
  });
  const location = init.headers.get("Location");
  if (!init.ok || !location) throw new Error(`Drive upload init ${init.status}`);
  const res = await fetch(location, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
  if (!res.ok) throw new Error(`Drive upload ${res.status}`);
  return (await res.json()) as DriveFile;
}

/** Upload video ke `fet-belajar/<tahap>/` di Drive user. */
export async function uploadVideo(stage: string, blob: Blob, name: string): Promise<DriveFile> {
  const { stage: folder } = await stageFolder(stage);
  return uploadBlob(folder.id, name, blob);
}

/** Jadikan file bisa dilihat siapa pun yang punya link (hanya atas persetujuan user). */
export async function shareWithLink(fileId: string): Promise<void> {
  await api(`${API}/files/${fileId}/permissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
}

/** Simpan catatan dan kode tahap ini sebagai file di folder Drive tahap tersebut. */
export async function exportWork(stage: string, files: Record<string, string>): Promise<DriveFile> {
  const { stage: folder } = await stageFolder(stage);
  for (const [name, content] of Object.entries(files)) {
    await upsertText(folder.id, name, content, name.endsWith(".md") ? "text/markdown" : "text/plain");
  }
  return folder;
}
