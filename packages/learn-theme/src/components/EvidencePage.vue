<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import Icon from "./Icon.vue";
import UserAvatar from "./UserAvatar.vue";
import { config, stageNumber } from "../lib/config";
import { isConfigured, session, signIn, type Profile } from "../lib/supabase";
import * as api from "../lib/api";
import { loadAllStatuses, loadChecklist, loadDraft, type Status } from "../lib/storage";
import { formatDate } from "../lib/i18n";
import { renderInline, renderMarkdown } from "../lib/markdown";
import { href, paths, query } from "../lib/routes";
import { useLang } from "../lib/useLang";
const { stages, phases, concepts } = config;

interface StageEvidence {
  status: Status;
  statusAt: string | null;
  checked: number[] | null;
  posts: api.FeedPost[];
  notes: string;
  code: api.Code | null;
  workAt: string | null;
}

const { lang, s } = useLang();
const mode = ref<"loading" | "public" | "local" | "missing" | "error">("loading");
const error = ref("");
const profile = ref<Profile | null>(null);
const byStage = ref<Record<string, StageEvidence>>({});
const conceptsPublic = ref(true);
const includePrivate = ref(false);
const onlyWorked = ref(true);
const copied = ref(false);
const generatedAt = ref(new Date().toISOString());

const isMe = computed(() => mode.value === "local" || (!!session.user && profile.value?.id === session.user.id));

function blank(): StageEvidence {
  return { status: "not-started", statusAt: null, checked: null, posts: [], notes: "", code: null, workAt: null };
}

function fresh(): Record<string, StageEvidence> {
  return Object.fromEntries(stages.map((st) => [st.slug, blank()]));
}

async function loadPublic(username: string) {
  const p = await api.getProfileByUsername(username);
  if (!p) {
    mode.value = "missing";
    return;
  }
  profile.value = p;
  const [progress, checklist, posts] = await Promise.all([
    api.getProgress(p.id),
    api.getPublicChecklist(p.id),
    api.listAllPostsByUser(p.id),
  ]);
  const out = fresh();
  for (const row of progress) {
    const e = out[row.stage];
    if (e) Object.assign(e, { status: row.status, statusAt: row.updated_at });
  }
  conceptsPublic.value = checklist !== null;
  for (const [stage, checked] of Object.entries(checklist ?? {})) {
    const e = out[stage];
    if (e) e.checked = checked;
  }
  for (const post of posts) out[post.stage]?.posts.push(post);
  byStage.value = out;
  mode.value = "public";
  if (includePrivate.value) await loadPrivate();
}

// Catatan dan kode hanya bisa dibaca pemiliknya (RLS), jadi hanya dimuat kalau diminta.
async function loadPrivate() {
  if (mode.value !== "public" || !isMe.value) return;
  for (const row of await api.getAllWork()) {
    const e = byStage.value[row.stage];
    if (!e) continue;
    Object.assign(e, { notes: row.notes, code: row.code, workAt: row.updated_at });
    if (e.checked === null && row.checked.length) e.checked = row.checked;
  }
}

function loadLocal() {
  const statuses = loadAllStatuses();
  const out = fresh();
  for (const st of stages) {
    const e = out[st.slug]!;
    const draft = loadDraft(st.slug);
    e.status = statuses[st.slug] ?? "not-started";
    e.checked = loadChecklist(st.slug);
    if (draft) {
      Object.assign(e, { notes: draft.notes, code: { html: draft.html, css: draft.css, js: draft.js }, workAt: draft.updatedAt, statusAt: draft.updatedAt });
    }
  }
  byStage.value = out;
  includePrivate.value = true;
  mode.value = "local";
}

async function load() {
  generatedAt.value = new Date().toISOString();
  try {
    const username = query("u") ?? session.profile?.username;
    if (isConfigured && username) await loadPublic(username);
    else if (isConfigured && !session.ready) return;
    else loadLocal();
  } catch (e) {
    mode.value = "error";
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(() => void load());
watch(
  () => [session.ready, session.profile?.username],
  () => {
    if (session.ready && !query("u")) void load();
  },
);
watch(includePrivate, (on) => {
  if (on) void loadPrivate().catch((e) => (error.value = String(e)));
});

const conceptList = computed(() => (lang.value === "en" ? concepts.en : concepts.id));

function worked(e: StageEvidence): boolean {
  return e.status !== "not-started" || (e.checked?.length ?? 0) > 0 || e.posts.length > 0;
}

const groups = computed(() =>
  phases.map((ph) => ({
    title: lang.value === "en" ? ph.en : ph.id,
    items: stages
      .slice(ph.range[0], ph.range[1])
      .map((st) => ({ ...st, e: byStage.value[st.slug] ?? blank(), concepts: conceptList.value[st.slug] ?? [] }))
      .filter((x) => !onlyWorked.value || worked(x.e)),
  })).filter((g) => g.items.length),
);

const totals = computed(() => {
  const all = Object.values(byStage.value);
  const conceptTotal = Object.values(conceptList.value).reduce((n, list) => n + list.length, 0);
  const dates = all
    .flatMap((e) => [e.statusAt, ...e.posts.map((p) => p.created_at)])
    .filter((d): d is string => !!d && Number.isFinite(Date.parse(d)))
    .sort();
  return {
    done: all.filter((e) => e.status === "done").length,
    concepts: all.reduce((n, e) => n + (e.checked?.length ?? 0), 0),
    conceptTotal,
    posts: all.reduce((n, e) => n + e.posts.length, 0),
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
  };
});

const shareUrl = computed(() => {
  if (typeof window === "undefined" || !profile.value) return "";
  return new URL(href(paths(lang.value).evidence(profile.value.username)), window.location.origin).toString();
});

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    // Clipboard diblokir: tautan tetap terlihat di bagian bawah halaman.
  }
}

function printPage() {
  window.print();
}

function hasCode(code: api.Code | null): code is api.Code {
  return !!code && [code.html, code.css, code.js].some((x) => x?.trim());
}
</script>

<template>
  <div class="fet-evidence">
    <p v-if="mode === 'loading'" class="fet-muted">{{ s.common.loading }}</p>
    <p v-else-if="mode === 'missing'" class="fet-callout">{{ s.profile.notFound }}</p>
    <p v-else-if="mode === 'error'" class="fet-alert">{{ s.common.error }}: {{ error }}</p>

    <template v-else>
      <header class="fet-evidence__head">
        <div class="fet-evidence__who">
          <UserAvatar v-if="profile" :name="profile.display_name || profile.username" :src="profile.avatar_url" :size="56" />
          <div>
            <p class="fet-evidence__kicker">{{ s.evidence.kicker }}</p>
            <h1>{{ profile ? profile.display_name || profile.username : s.evidence.title }}</h1>
            <p class="fet-muted fet-small">
              <template v-if="profile">@{{ profile.username }} · </template>{{ s.evidence.title }} · fet
            </p>
          </div>
        </div>
        <div class="fet-evidence__toolbar">
          <button v-if="profile" class="fet-btn fet-btn--ghost fet-btn--sm" @click="copyLink">
            <Icon :name="copied ? 'check' : 'link'" /> {{ copied ? s.evidence.copied : s.evidence.copyLink }}
          </button>
          <button class="fet-btn fet-btn--sm" @click="printPage"><Icon name="printer" /> {{ s.evidence.print }}</button>
        </div>
      </header>

      <p class="fet-lead">{{ s.evidence.lead }}</p>

      <div v-if="mode === 'local'" class="fet-callout fet-evidence__noprint">
        <span>{{ s.evidence.localMode }}</span>
        <div v-if="isConfigured" class="fet-row">
          <button class="fet-btn fet-btn--sm" @click="signIn('github')"><Icon name="github" /> GitHub</button>
          <button class="fet-btn fet-btn--sm fet-btn--ghost" @click="signIn('google')"><Icon name="mail" /> Google</button>
        </div>
      </div>

      <div class="fet-stats fet-evidence__stats">
        <div><strong>{{ totals.done }}/{{ stages.length }}</strong>{{ s.evidence.statStages }}</div>
        <div><strong>{{ conceptsPublic || isMe ? `${totals.concepts}/${totals.conceptTotal}` : "–" }}</strong>{{ s.evidence.statConcepts }}</div>
        <div><strong>{{ totals.posts }}</strong>{{ s.evidence.statPosts }}</div>
        <div>
          <strong>{{ totals.from ? `${formatDate(totals.from, lang)} – ${formatDate(totals.to!, lang)}` : "–" }}</strong>{{ s.evidence.statPeriod }}
        </div>
      </div>

      <div class="fet-evidence__filters fet-evidence__noprint">
        <label class="fet-toggle"><input v-model="onlyWorked" type="checkbox" /> {{ s.evidence.onlyWorked }}</label>
        <label v-if="isMe && mode === 'public'" class="fet-toggle"><input v-model="includePrivate" type="checkbox" /> {{ s.evidence.includePrivate }}</label>
      </div>

      <p v-if="!conceptsPublic && !isMe" class="fet-muted fet-small">{{ s.evidence.conceptsNotShared }}</p>
      <p v-if="!groups.length" class="fet-callout">{{ s.evidence.empty }}</p>

      <section v-for="g in groups" :key="g.title" class="fet-evidence__phase">
        <h2>{{ g.title }}</h2>
        <article v-for="st in g.items" :key="st.slug" class="fet-card fet-evidence__stage">
          <header class="fet-evidence__stage-head">
            <span class="fet-evidence__num">{{ stageNumber(st.slug) }}</span>
            <h3><a :href="href(paths(lang).stage(st.slug))">{{ st.title }}</a></h3>
            <span class="fet-badge" :data-status="st.e.status">{{ s.status[st.e.status] }}</span>
          </header>
          <p v-if="st.e.statusAt" class="fet-muted fet-small">
            {{ st.e.status === "done" ? s.evidence.completedOn : s.evidence.lastActivity }}: {{ formatDate(st.e.statusAt, lang) }}
          </p>

          <template v-if="st.e.checked !== null && st.concepts.length">
            <div class="fet-evidence__concept-head">
              <span>{{ s.evidence.concepts }}</span>
              <span class="fet-muted fet-small">{{ st.e.checked.length }}/{{ st.concepts.length }}</span>
            </div>
            <div class="fet-progress-bar"><span :style="{ width: `${(st.e.checked.length / st.concepts.length) * 100}%` }" /></div>
            <ul class="fet-evidence__concepts">
              <li v-for="(c, i) in st.concepts" :key="i" :class="{ done: st.e.checked.includes(i) }">
                <Icon v-if="st.e.checked.includes(i)" name="check" :size="14" />
                <span v-else class="fet-evidence__dot" />
                <span v-html="renderInline(c)" />
              </li>
            </ul>
          </template>

          <template v-if="st.e.posts.length">
            <h4>{{ s.evidence.publications }}</h4>
            <ul class="fet-evidence__posts">
              <li v-for="p in st.e.posts" :key="p.id">
                <a :href="href(paths(lang).post(p.id))">{{ p.title }}</a>
                <span class="fet-muted fet-small"> · {{ formatDate(p.created_at, lang) }}</span>
                <span v-if="p.video_url" class="fet-muted fet-small"> · video</span>
                <span v-if="p.code" class="fet-muted fet-small"> · {{ s.evidence.code.toLowerCase() }}</span>
              </li>
            </ul>
          </template>

          <template v-if="includePrivate && isMe">
            <template v-if="st.e.notes.trim()">
              <h4>{{ s.evidence.notes }}</h4>
              <div class="fet-evidence__notes vp-doc" v-html="renderMarkdown(st.e.notes)" />
            </template>
            <template v-if="hasCode(st.e.code)">
              <h4>{{ s.evidence.code }}</h4>
              <template v-for="k in (['html', 'css', 'js'] as const)" :key="k">
                <div v-if="st.e.code[k]?.trim()" class="fet-evidence__code">
                  <span>{{ k.toUpperCase() }}</span>
                  <pre><code>{{ st.e.code[k] }}</code></pre>
                </div>
              </template>
            </template>
          </template>
        </article>
      </section>

      <footer class="fet-evidence__foot fet-muted fet-small">
        <p>{{ s.evidence.generated(formatDate(generatedAt, lang)) }}</p>
        <p v-if="shareUrl">{{ s.evidence.verify }} <a :href="shareUrl">{{ shareUrl }}</a></p>
      </footer>
    </template>
  </div>
</template>
