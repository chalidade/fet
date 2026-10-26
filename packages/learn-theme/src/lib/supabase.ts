import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { reactive } from "vue";

const url: string = import.meta.env.VITE_SUPABASE_URL ?? "";
const anonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isConfigured = url.length > 0 && anonKey.length > 0;

let client: SupabaseClient | null = null;

/** Client Supabase (hanya di browser). Null kalau belum dikonfigurasi. */
export function sb(): SupabaseClient | null {
  if (!isConfigured || typeof window === "undefined") return null;
  client ??= createClient(url, anonKey, {
    auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true },
  });
  return client;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  created_at: string;
}

export const session = reactive<{ ready: boolean; user: User | null; profile: Profile | null }>({
  ready: false,
  user: null,
  profile: null,
});

async function loadProfile(userId: string): Promise<void> {
  const { data } = await sb()!.from("profiles").select("*").eq("id", userId).maybeSingle();
  session.profile = (data as Profile | null) ?? null;
}

let started = false;

/** Mulai memantau sesi login. Aman dipanggil berkali-kali. */
export function initSession(): void {
  if (started) return;
  started = true;
  const c = sb();
  if (!c) {
    session.ready = true;
    return;
  }
  c.auth.onAuthStateChange((_event, s) => {
    session.user = s?.user ?? null;
    if (session.user) {
      // Ditunda supaya tidak memanggil Supabase dari dalam callback auth.
      setTimeout(() => void loadProfile(session.user!.id).finally(() => (session.ready = true)), 0);
    } else {
      session.profile = null;
      session.ready = true;
    }
  });
}

export async function signIn(provider: "github" | "google"): Promise<void> {
  const c = sb();
  if (!c) return;
  const redirectTo = window.location.href.split("#")[0];
  const { error } = await c.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await sb()?.auth.signOut();
}

export async function refreshProfile(): Promise<void> {
  if (session.user) await loadProfile(session.user.id);
}
