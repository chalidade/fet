<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import CodePlayground from "./CodePlayground.vue";
import CodeEditor from "./CodeEditor.vue";
import VideoRecorder from "./VideoRecorder.vue";
import { stages, findStage } from "../../stages";
import { isConfigured, session, signIn } from "../lib/supabase";
import * as api from "../lib/api";
import * as drive from "../lib/drive";
import { loadAllStatuses, loadDraft, saveDraft, starter, type StageDraft, type Status } from "../lib/storage";
import { href, paths, query } from "../lib/routes";
import { useLang } from "../lib/useLang";

const { lang, s } = useLang();

const slug = ref<string | null>(null);
const stage = computed(() => findStage(slug.value));
const tab = ref<"code" | "notes" | "video" | "share">("code");

const draft = reactive<StageDraft>(starter("", "", "id"));
const loaded = ref(false);
const cloudState = ref<"idle" | "saving" | "saved" | "error">("idle");
const cloudError = ref("");
const statuses = ref<Record<string, Status>>({});

// Isi terakhir yang sudah dimuat/disimpan; perubahan dari proses loading tidak dianggap edit.
let lastContent = "";
function contentKey(): string {
  return JSON.stringify([draft.html, draft.css, draft.js, draft.notes]);
}

// ---------------------------------------------------------------- loading

async function loadOverview() {
  statuses.value = loadAllStatuses();
  if (isConfigured && session.user) {
    try {
      statuses.value = { ...statuses.value, ...(await api.getStatuses(session.user.id)) };
    } catch {
      // tetap tampilkan status lokal
    }
  }
}

async function loadStage(st: NonNullable<typeof stage.value>) {
  loaded.value = false;
  const local = loadDraft(st.slug) ?? starter(st.slug, st.title, lang.value);
  Object.assign(draft, local);
  if (isConfigured && session.user) {
    try {
      const [work, sts] = await Promise.all([api.getWork(st.slug), api.getStatuses(session.user.id)]);
      if (work && work.updated_at > local.updatedAt) {
        draft.notes = work.notes;
        draft.html = work.code.html ?? draft.html;
        draft.css = work.code.css ?? draft.css;
        draft.js = work.code.js ?? draft.js;
        draft.updatedAt = work.updated_at;
      }
      if (sts[st.slug]) draft.status = sts[st.slug]!;
      cloudState.value = "saved";
    } catch (e) {
      cloudState.value = "error";
      cloudError.value = e instanceof Error ? e.message : String(e);
    }
  }
  lastContent = contentKey();
  loaded.value = true;
}

function selectStage(next: string | null) {
  slug.value = next;
  const url = new URL(window.location.href);
  if (next) url.searchParams.set("tahap", next);
  else url.searchParams.delete("tahap");
  history.pushState(null, "", url);
}

onMounted(() => {
  slug.value = query("tahap");
  window.addEventListener("popstate", () => (slug.value = query("tahap")));
});

watch(
  [slug, () => session.ready, () => session.user?.id],
  ([, ready]) => {
    if (!ready) return;
    if (stage.value) void loadStage(stage.value);
    else void loadOverview();
  },
  { immediate: true },
);

// ---------------------------------------------------------------- saving

let localTimer: ReturnType<typeof setTimeout> | undefined;
let cloudTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => [draft.html, draft.css, draft.js, draft.notes],
  () => {
    if (!loaded.value || !stage.value) return;
    const key = contentKey();
    if (key === lastContent) return;
    lastContent = key;
    const st = stage.value;
    if (draft.status === "not-started") setStatus("in-progress");
    draft.updatedAt = new Date().toISOString();
    clearTimeout(localTimer);
    localTimer = setTimeout(() => saveDraft(st.slug, { ...draft }), 400);
    if (isConfigured && session.user) {
      cloudState.value = "saving";
      clearTimeout(cloudTimer);
      cloudTimer = setTimeout(async () => {
        try {
          await api.saveWork(st.slug, draft.notes, code.value);
          cloudState.value = "saved";
        } catch (e) {
          cloudState.value = "error";
          cloudError.value = e instanceof Error ? e.message : String(e);
        }
      }, 1500);
    }
  },
);

async function setStatus(next: Status) {
  if (!stage.value) return;
  draft.status = next;
  saveDraft(stage.value.slug, { ...draft });
  if (isConfigured && session.user) {
    try {
      await api.setStatus(stage.value.slug, next);
    } catch (e) {
      cloudState.value = "error";
      cloudError.value = e instanceof Error ? e.message : String(e);
    }
  }
}

const code = computed<api.Code>({
  get: () => ({ html: draft.html, css: draft.css, js: draft.js }),
  set: (v) => Object.assign(draft, v),
});

function resetCode() {
  if (!stage.value) return;
  const fresh = starter(stage.value.slug, stage.value.title, lang.value);
  Object.assign(draft, { html: fresh.html, css: fresh.css, js: fresh.js });
}

// ---------------------------------------------------------------- export

function files(): Record<string, string> {
  return { "index.html": draft.html, "style.css": draft.css, "script.js": draft.js, "notes.md": draft.notes };
}

async function downloadZip() {
  if (!stage.value) return;
  const { zipSync, strToU8 } = await import("fflate");
  const entries = Object.fromEntries(Object.entries(files()).map(([k, v]) => [`${stage.value!.slug}/${k}`, strToU8(v)]));
  const blob = new Blob([zipSync(entries)], { type: "application/zip" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `fet-${stage.value.slug}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const driveState = ref<"idle" | "busy" | "done" | "error">("idle");
const driveFolder = ref("");
async function exportToDrive() {
  if (!stage.value) return;
  driveState.value = "busy";
  try {
    if (!drive.isConnected()) await drive.connect();
    const folder = await drive.exportWork(stage.value.slug, files());
    driveFolder.value = folder.webViewLink ?? "";
    driveState.value = "done";
  } catch (e) {
    driveState.value = "error";
    cloudError.value = e instanceof Error ? e.message : String(e);
  }
}

// ---------------------------------------------------------------- share

const form = reactive({ title: "", body: "", videoUrl: "", includeCode: true });
const shareState = ref<"idle" | "busy" | "done" | "error">("idle");
const shareError = ref("");
const postId = ref("");

function useVideo(url: string) {
  form.videoUrl = url;
  tab.value = "share";
}

async function publish() {
  if (!stage.value) return;
  shareError.value = "";
  const video = form.videoUrl.trim();
  if (video && !/^https:\/\//.test(video)) {
    shareError.value = "https://…";
    return;
  }
  shareState.value = "busy";
  try {
    postId.value = await api.createPost({
      stage: stage.value.slug,
      title: form.title.trim(),
      body: form.body,
      video_url: video || null,
      code: form.includeCode ? code.value : null,
    });
    shareState.value = "done";
    form.title = "";
    form.body = "";
    form.videoUrl = "";
  } catch (e) {
    shareState.value = "error";
    shareError.value = e instanceof Error ? e.message : String(e);
  }
}

const statusOptions: Status[] = ["not-started", "in-progress", "done"];
</script>

<template>
  <div class="fet-room">
    <!-- Ringkasan: belum memilih tahap -->
    <template v-if="!stage">
      <h1>{{ s.room.title }}</h1>
      <p>{{ s.room.intro }}</p>
      <div v-if="isConfigured && session.ready && !session.user" class="fet-callout">
        <span>{{ s.auth.needLogin }}</span>
        <div class="fet-toolbar">
          <button class="fet-btn fet-btn--small" @click="signIn('github')">{{ s.auth.withGithub }}</button>
          <button class="fet-btn fet-btn--small fet-btn--ghost" @click="signIn('google')">{{ s.auth.withGoogle }}</button>
        </div>
      </div>
      <h2>{{ s.room.overview }}</h2>
      <p class="fet-muted">{{ s.room.overviewHint }}</p>
      <div class="fet-stage-grid">
        <button v-for="st in stages" :key="st.slug" class="fet-stage-card" @click="selectStage(st.slug)">
          <span class="fet-stage-card__num">{{ st.slug.slice(0, 2) }}</span>
          <span class="fet-stage-card__title">{{ st.title }}</span>
          <span class="fet-badge" :data-status="statuses[st.slug] ?? 'not-started'">
            {{ s.status[statuses[st.slug] ?? "not-started"] }}
          </span>
        </button>
      </div>
    </template>

    <!-- Ruang kerja satu tahap -->
    <template v-else>
      <div class="fet-room__header">
        <button class="fet-link" @click="selectStage(null)">← {{ s.room.title }}</button>
        <h1>{{ stage.slug.slice(0, 2) }} · {{ stage.title }}</h1>
        <div class="fet-toolbar">
          <a class="fet-btn fet-btn--small fet-btn--ghost" :href="href(paths(lang).stage(stage.slug))" target="_blank">
            📖 {{ s.room.material }}
          </a>
          <label class="fet-field fet-field--inline">
            <span>{{ s.room.status }}</span>
            <select :value="draft.status" @change="setStatus(($event.target as HTMLSelectElement).value as Status)">
              <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ s.status[opt] }}</option>
            </select>
          </label>
          <span class="spacer" />
          <span class="fet-muted fet-small">
            <template v-if="!isConfigured || !session.user">{{ s.room.savedLocal }}</template>
            <template v-else-if="cloudState === 'saving'">{{ s.common.saving }}</template>
            <template v-else-if="cloudState === 'saved'">✓ {{ s.room.savedCloud }}</template>
            <template v-else-if="cloudState === 'error'"><span class="fet-error">{{ s.common.error }}: {{ cloudError }}</span></template>
          </span>
        </div>
      </div>

      <div class="fet-tabs fet-tabs--main" role="tablist">
        <button v-for="key in (['code', 'notes', 'video', 'share'] as const)" :key="key" role="tab" :aria-selected="tab === key" :class="{ active: tab === key }" @click="tab = key">
          {{ s.room.tabs[key] }}
        </button>
      </div>

      <div v-if="!loaded" class="fet-muted">{{ s.common.loading }}</div>
      <template v-else>
        <CodePlayground v-show="tab === 'code'" v-model="code" @reset="resetCode" />

        <div v-show="tab === 'notes'">
          <p class="fet-muted fet-small">{{ s.room.notesHint }}</p>
          <CodeEditor v-model="draft.notes" language="md" :label="s.room.tabs.notes" class="fet-editor--tall" />
        </div>

        <VideoRecorder v-if="tab === 'video'" :stage="stage.slug" @use="useVideo" />

        <div v-show="tab === 'share'" class="fet-share">
          <h3>{{ s.share.title }}</h3>
          <p class="fet-muted">{{ s.share.hint }}</p>
          <div v-if="!isConfigured" class="fet-callout">{{ s.common.notConfigured }}</div>
          <div v-else-if="!session.user" class="fet-callout">
            <span>{{ s.auth.needLogin }}</span>
            <div class="fet-toolbar">
              <button class="fet-btn fet-btn--small" @click="signIn('github')">{{ s.auth.withGithub }}</button>
              <button class="fet-btn fet-btn--small fet-btn--ghost" @click="signIn('google')">{{ s.auth.withGoogle }}</button>
            </div>
          </div>
          <form v-else class="fet-form" @submit.prevent="publish">
            <label class="fet-field">
              <span>{{ s.share.postTitle }}</span>
              <input v-model="form.title" required minlength="3" maxlength="120" :placeholder="s.share.postTitlePh" />
            </label>
            <label class="fet-field">
              <span>{{ s.share.body }}</span>
              <textarea v-model="form.body" rows="8" maxlength="20000" />
            </label>
            <button type="button" class="fet-btn fet-btn--small fet-btn--ghost" @click="form.body = draft.notes">
              {{ s.share.useNotes }}
            </button>
            <label class="fet-field">
              <span>{{ s.share.videoUrl }}</span>
              <input v-model="form.videoUrl" type="url" placeholder="https://drive.google.com/…" />
              <small class="fet-muted">{{ s.share.videoShare }}</small>
            </label>
            <label class="fet-check"><input v-model="form.includeCode" type="checkbox" /> {{ s.share.includeCode }}</label>
            <div class="fet-toolbar">
              <button class="fet-btn" type="submit" :disabled="shareState === 'busy'">{{ s.share.publish }}</button>
              <span v-if="shareState === 'done'">
                ✓ {{ s.share.published }} <a :href="href(paths(lang).post(postId))">{{ s.share.view }} →</a>
              </span>
              <span v-if="shareError" class="fet-error">{{ shareError }}</span>
            </div>
          </form>
        </div>

        <div class="fet-toolbar fet-room__footer">
          <button class="fet-btn fet-btn--small fet-btn--ghost" @click="downloadZip">⬇ {{ s.room.downloadZip }}</button>
          <button v-if="drive.isConfigured" class="fet-btn fet-btn--small fet-btn--ghost" :disabled="driveState === 'busy'" @click="exportToDrive">
            {{ driveState === "busy" ? s.common.saving : s.room.exportDrive }}
          </button>
          <a v-if="driveState === 'done' && driveFolder" :href="driveFolder" target="_blank" rel="noopener">✓ {{ s.room.exported }}</a>
        </div>
      </template>
    </template>
  </div>
</template>
