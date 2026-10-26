import { sb, session, type Profile } from "./supabase";
import type { Status } from "./storage";

export interface Code {
  html: string;
  css: string;
  js: string;
}

export interface FeedPost {
  id: string;
  user_id: string;
  stage: string;
  title: string;
  body: string;
  video_url: string | null;
  code: Code | null;
  created_at: string;
  updated_at: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  reaction_count: number;
  comment_count: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
}

function client() {
  const c = sb();
  if (!c) throw new Error("Supabase is not configured");
  return c;
}

function me(): string {
  const id = session.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// --- Progres & hasil kerja ---------------------------------------------------

export async function getWork(stage: string): Promise<{ notes: string; code: Code; updated_at: string } | null> {
  const res = await client().from("stage_work").select("notes, code, updated_at").eq("user_id", me()).eq("stage", stage).maybeSingle();
  return check(res) as { notes: string; code: Code; updated_at: string } | null;
}

export async function saveWork(stage: string, notes: string, code: Code): Promise<void> {
  check(await client().from("stage_work").upsert({ user_id: me(), stage, notes, code }));
}

// Kolom stage_work.checked ditambahkan oleh migrasi 20261027; kalau belum dijalankan,
// pemanggil cukup jatuh ke penyimpanan lokal.
export async function getChecklist(stage: string): Promise<number[] | null> {
  const res = await client().from("stage_work").select("checked").eq("user_id", me()).eq("stage", stage).maybeSingle();
  return (check(res) as { checked: number[] } | null)?.checked ?? null;
}

export async function saveChecklist(stage: string, checked: number[]): Promise<void> {
  check(await client().from("stage_work").upsert({ user_id: me(), stage, checked }));
}

export async function getStatuses(userId: string): Promise<Record<string, Status>> {
  const rows = check(await client().from("stage_progress").select("stage, status").eq("user_id", userId)) as Array<{
    stage: string;
    status: Status;
  }>;
  return Object.fromEntries(rows.map((r) => [r.stage, r.status]));
}

export async function setStatus(stage: string, status: Status): Promise<void> {
  check(await client().from("stage_progress").upsert({ user_id: me(), stage, status }));
}

export async function stageStats(stage: string): Promise<{ learning: number; done: number }> {
  const row = check(await client().from("stage_stats").select("learning, done").eq("stage", stage).maybeSingle()) as {
    learning: number;
    done: number;
  } | null;
  return row ?? { learning: 0, done: 0 };
}

// --- Bukti belajar -----------------------------------------------------------

export interface ProgressRow {
  stage: string;
  status: Status;
  updated_at: string;
}

export interface WorkRow {
  stage: string;
  notes: string;
  code: Code;
  checked: number[];
  updated_at: string;
}

export async function getProgress(userId: string): Promise<ProgressRow[]> {
  return check(await client().from("stage_progress").select("stage, status, updated_at").eq("user_id", userId)) as ProgressRow[];
}

/** Konsep yang dicentang per tahap (publik). `null` kalau migrasi 20261028 belum dijalankan. */
export async function getPublicChecklist(userId: string): Promise<Record<string, number[]> | null> {
  const res = await client().rpc("public_checklist", { p_user: userId });
  if (res.error) return null;
  const rows = (res.data ?? []) as Array<{ stage: string; checked: number[] }>;
  return Object.fromEntries(rows.map((r) => [r.stage, r.checked]));
}

/** Semua catatan dan kode milik user yang sedang login (privat, hanya untuk pemiliknya). */
export async function getAllWork(): Promise<WorkRow[]> {
  return check(await client().from("stage_work").select("stage, notes, code, checked, updated_at").eq("user_id", me())) as WorkRow[];
}

export async function listAllPostsByUser(userId: string): Promise<FeedPost[]> {
  const q = client().from("posts_feed").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(500);
  return check(await q) as FeedPost[];
}

// --- Postingan -------------------------------------------------------------------

export const PAGE_SIZE = 10;

export async function listPosts(opts: { stage?: string; userId?: string; before?: string } = {}): Promise<FeedPost[]> {
  let q = client().from("posts_feed").select("*").order("created_at", { ascending: false }).limit(PAGE_SIZE);
  if (opts.stage) q = q.eq("stage", opts.stage);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.before) q = q.lt("created_at", opts.before);
  return check(await q) as FeedPost[];
}

export async function getPost(id: string): Promise<FeedPost | null> {
  return check(await client().from("posts_feed").select("*").eq("id", id).maybeSingle()) as FeedPost | null;
}

export async function createPost(input: {
  stage: string;
  title: string;
  body: string;
  video_url: string | null;
  code: Code | null;
}): Promise<string> {
  const row = check(await client().from("posts").insert({ ...input, user_id: me() }).select("id").single()) as { id: string };
  return row.id;
}

export async function deletePost(id: string): Promise<void> {
  check(await client().from("posts").delete().eq("id", id));
}

// --- Komentar & reaksi -------------------------------------------------------

export async function listComments(postId: string): Promise<Comment[]> {
  const res = await client()
    .from("comments")
    .select("id, post_id, user_id, body, created_at, profiles(username, display_name, avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return check(res) as unknown as Comment[];
}

export async function addComment(postId: string, body: string): Promise<void> {
  check(await client().from("comments").insert({ post_id: postId, user_id: me(), body }));
}

export async function deleteComment(id: string): Promise<void> {
  check(await client().from("comments").delete().eq("id", id));
}

export async function hasReacted(postId: string): Promise<boolean> {
  if (!session.user) return false;
  const res = await client().from("reactions").select("post_id").eq("post_id", postId).eq("user_id", me()).maybeSingle();
  return check(res) !== null;
}

export async function toggleReaction(postId: string, on: boolean): Promise<void> {
  if (on) check(await client().from("reactions").insert({ post_id: postId, user_id: me() }));
  else check(await client().from("reactions").delete().eq("post_id", postId).eq("user_id", me()));
}

// --- Profil ------------------------------------------------------------------

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  return check(await client().from("profiles").select("*").eq("username", username).maybeSingle()) as Profile | null;
}

export async function updateProfile(patch: Partial<Pick<Profile, "username" | "display_name" | "bio">>): Promise<void> {
  check(await client().from("profiles").update(patch).eq("id", me()));
}
