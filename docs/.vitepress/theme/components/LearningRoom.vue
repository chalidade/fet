<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import CodePlayground from "./CodePlayground.vue";
import CodeEditor from "./CodeEditor.vue";
import VideoRecorder from "./VideoRecorder.vue";
import DropMenu from "./DropMenu.vue";
import Icon from "./Icon.vue";
import type { IconName } from "../lib/icons";
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

const confirmReset = ref(false);
function resetCode(e: MouseEvent) {
  if (!stage.value) return;
  if (!confirmReset.value) {
    // Klik pertama hanya meminta konfirmasi; menu tetap terbuka.
    e.stopPropagation();
    confirmReset.value = true;
    setTimeout(() => (confirmReset.value = false), 3000);
    return;
  }
  confirmReset.value = false;
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
const tabIcons: Record<typeof tab.value, IconName> = { code: "code", notes: "notes", video: "video", share: "send" };

const doneCount = computed(() => stages.filter((st) => statuses.value[st.slug] === "done").length);
// Tahap yang paling masuk akal untuk dilanjutkan: yang sedang dipelajari, kalau tidak ada tahap pertama yang belum selesai.
const nextStage = computed(
  () =>
    stages.find((st) => statuses.value[st.slug] === "in-progress") ??
    stages.find((st) => statuses.value[st.slug] !== "done"),
);
</script>

<template>
  <div class="fet-room">
    <!-- Ringkasan: belum memilih tahap -->
    <template v-if="!stage">
      <header class="fet-page-head">
        <div>
          <h1>{{ s.room.title }}</h1>
          <p class="fet-lead">{{ s.room.intro }}</p>
        </div>
      </header>

      <div v-if="isConfigured && session.ready && !session.user" class="fet-callout">
        <span>{{ s.auth.needLogin }}</span>
        <div class="fet-row">
          <button class="fet-btn fet-btn--sm" @click="signIn('github')"><Icon name="github" /> GitHub</button>
          <button class="fet-btn fet-btn--sm fet-btn--ghost" @click="signIn('google')"><Icon name="mail" /> Google</button>
        </div>
      </div>

      <section class="fet-card fet-summary">
        <div class="fet-summary__progress">
          <span class="fet-summary__count"><strong>{{ doneCount }}</strong> {{ s.room.progressOf(stages.length) }}</span>
          <div class="fet-progress-bar" role="progressbar" :aria-valuenow="doneCount" aria-valuemin="0" :aria-valuemax="stages.length">
            <span :style="{ width: `${(doneCount / stages.length) * 100}%` }" />
          </div>
        </div>
        <button v-if="nextStage" class="fet-btn" @click="selectStage(nextStage.slug)">
          {{ doneCount || statuses[nextStage.slug] ? `${s.room.continueAt}: ${nextStage.title}` : s.room.startFirst }}
          <Icon name="arrow-right" />
        </button>
      </section>

      <h2>{{ s.room.allStages }}</h2>
      <ul class="fet-stage-list">
        <li v-for="st in stages" :key="st.slug">
          <button class="fet-stage-item" :data-status="statuses[st.slug] ?? 'not-started'" @click="selectStage(st.slug)">
            <span class="fet-stage-item__num">
              <Icon v-if="statuses[st.slug] === 'done'" name="check" :size="15" />
              <template v-else>{{ st.slug.slice(0, 2) }}</template>
            </span>
            <span class="fet-stage-item__title">{{ st.title }}</span>
            <span class="fet-stage-item__status">{{ s.status[statuses[st.slug] ?? "not-started"] }}</span>
          </button>
        </li>
      </ul>
    </template>

    <!-- Ruang kerja satu tahap -->
    <template v-else>
      <header class="fet-ws-head">
        <div>
          <button class="fet-link fet-link--muted fet-small" @click="selectStage(null)">
            <Icon name="arrow-left" :size="14" /> {{ s.room.title }}
          </button>
        </div>
        <div class="fet-ws-title">
          <h1><span class="num">{{ stage.slug.slice(0, 2) }}</span> {{ stage.title }}</h1>
          <div class="fet-ws-actions">
            <a class="fet-icon-btn" :href="href(paths(lang).stage(stage.slug))" target="_blank" :title="s.room.material">
              <Icon name="book" /> <span class="label">{{ s.room.material }}</span>
            </a>
            <DropMenu :label="s.room.more">
              <template #trigger><span class="fet-icon-btn"><Icon name="more" /></span></template>
              <button role="menuitem" @click="downloadZip"><Icon name="download" /> {{ s.room.downloadZip }}</button>
              <button v-if="drive.isConfigured" role="menuitem" :disabled="driveState === 'busy'" @click="exportToDrive">
                <Icon name="cloud" /> {{ driveState === "busy" ? s.common.saving : s.room.exportDrive }}
              </button>
              <hr />
              <button role="menuitem" class="is-danger" @click="resetCode">
                <Icon name="reset" /> {{ confirmReset ? s.room.resetConfirm : s.room.resetCode }}
              </button>
            </DropMenu>
          </div>
        </div>
        <div class="fet-ws-meta">
          <div class="fet-seg" role="radiogroup" :aria-label="s.room.status" :data-value="draft.status">
            <button
              v-for="opt in statusOptions"
              :key="opt"
              role="radio"
              :aria-checked="draft.status === opt"
              :class="{ active: draft.status === opt }"
              @click="setStatus(opt)"
            >
              {{ s.status[opt] }}
            </button>
          </div>
          <span v-if="!isConfigured || !session.user" class="fet-save" :title="s.room.savedLocal">{{ s.room.savedLocalShort }}</span>
          <span v-else class="fet-save" :data-state="cloudState" :title="cloudState === 'error' ? cloudError : undefined">
            <template v-if="cloudState === 'saving'">{{ s.common.saving }}</template>
            <template v-else-if="cloudState === 'error'">{{ s.common.error }}</template>
            <template v-else>{{ s.room.savedCloud }}</template>
          </span>
          <a v-if="driveState === 'done' && driveFolder" class="fet-link fet-small" :href="driveFolder" target="_blank" rel="noopener">
            <Icon name="check" :size="14" /> {{ s.room.exported }}
          </a>
          <span v-if="driveState === 'error'" class="fet-error fet-small">{{ cloudError }}</span>
        </div>
      </header>

      <nav class="fet-tabbar" role="tablist">
        <button
          v-for="key in (['code', 'notes', 'video', 'share'] as const)"
          :key="key"
          role="tab"
          :aria-selected="tab === key"
          :class="{ active: tab === key }"
          @click="tab = key"
        >
          <Icon :name="tabIcons[key]" :size="18" /> {{ s.room.tabs[key] }}
        </button>
      </nav>

      <div v-if="!loaded" class="fet-muted">{{ s.common.loading }}</div>
      <template v-else>
        <CodePlayground v-show="tab === 'code'" v-model="code" />

        <div v-show="tab === 'notes'">
          <p class="fet-hint"><Icon name="sparkle" /> {{ s.room.notesHint }}</p>
          <CodeEditor v-model="draft.notes" language="md" :label="s.room.tabs.notes" class="fet-editor--framed" />
        </div>

        <VideoRecorder v-if="tab === 'video'" :stage="stage.slug" @use="useVideo" />

        <section v-show="tab === 'share'" class="fet-share">
          <h3>{{ s.share.title }}</h3>
          <p class="fet-muted fet-small">{{ s.share.hint }}</p>
          <div v-if="!isConfigured" class="fet-callout">{{ s.common.notConfigured }}</div>
          <div v-else-if="!session.user" class="fet-callout">
            <span>{{ s.auth.needLogin }}</span>
            <div class="fet-row">
              <button class="fet-btn fet-btn--sm" @click="signIn('github')"><Icon name="github" /> GitHub</button>
              <button class="fet-btn fet-btn--sm fet-btn--ghost" @click="signIn('google')"><Icon name="mail" /> Google</button>
            </div>
          </div>
          <form v-else class="fet-form fet-card" @submit.prevent="publish">
            <label class="fet-field">
              <span>{{ s.share.postTitle }}</span>
              <input v-model="form.title" required minlength="3" maxlength="120" :placeholder="s.share.postTitlePh" />
            </label>
            <div class="fet-field">
              <div class="fet-field__row">
                <label for="fet-share-body">{{ s.share.body }}</label>
                <button type="button" class="fet-link fet-small" @click="form.body = draft.notes">
                  <Icon name="notes" :size="14" /> {{ s.share.useNotes }}
                </button>
              </div>
              <textarea id="fet-share-body" v-model="form.body" rows="8" maxlength="20000" />
            </div>
            <label class="fet-field">
              <span>{{ s.share.videoUrl }}</span>
              <input v-model="form.videoUrl" type="url" inputmode="url" placeholder="https://drive.google.com/…" />
              <small>{{ s.share.videoShare }}</small>
            </label>
            <label class="fet-check"><input v-model="form.includeCode" type="checkbox" /> {{ s.share.includeCode }}</label>
            <div class="fet-form__actions">
              <span v-if="shareState === 'done'" class="note">
                <Icon name="check" :size="14" /> {{ s.share.published }}
                <a class="fet-link" :href="href(paths(lang).post(postId))">{{ s.share.view }} →</a>
              </span>
              <span v-if="shareError" class="note fet-error">{{ shareError }}</span>
              <button class="fet-btn" type="submit" :disabled="shareState === 'busy'">
                <Icon name="send" /> {{ s.share.publish }}
              </button>
            </div>
          </form>
        </section>
      </template>
    </template>
  </div>
</template>
