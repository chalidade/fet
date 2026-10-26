<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import UserAvatar from "./UserAvatar.vue";
import PostCard from "./PostCard.vue";
import { stages } from "../../stages";
import { isConfigured, refreshProfile, session, signIn, type Profile } from "../lib/supabase";
import * as api from "../lib/api";
import type { Status } from "../lib/storage";
import { formatDate } from "../lib/i18n";
import { href, paths, query } from "../lib/routes";
import { useLang } from "../lib/useLang";

const { lang, s } = useLang();
const profile = ref<Profile | null>(null);
const statuses = ref<Record<string, Status>>({});
const posts = ref<api.FeedPost[]>([]);
const state = ref<"loading" | "ready" | "missing" | "login" | "error">("loading");
const error = ref("");
const editing = ref(false);
const form = reactive({ username: "", display_name: "", bio: "" });
const saveError = ref("");

const isMe = computed(() => !!session.user && profile.value?.id === session.user.id);
const doneCount = computed(() => Object.values(statuses.value).filter((x) => x === "done").length);

async function load() {
  if (!isConfigured) {
    state.value = "missing";
    return;
  }
  const username = query("u") ?? session.profile?.username;
  if (!username) {
    state.value = session.user ? "loading" : "login";
    return;
  }
  try {
    profile.value = await api.getProfileByUsername(username);
    if (!profile.value) {
      state.value = "missing";
      return;
    }
    [statuses.value, posts.value] = await Promise.all([
      api.getStatuses(profile.value.id),
      api.listPosts({ userId: profile.value.id }),
    ]);
    state.value = "ready";
  } catch (e) {
    state.value = "error";
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(() => {
  if (session.ready) void load();
});
watch(
  () => [session.ready, session.profile?.username],
  ([ready]) => {
    if (ready) void load();
  },
);

function startEdit() {
  if (!profile.value) return;
  Object.assign(form, { username: profile.value.username, display_name: profile.value.display_name, bio: profile.value.bio });
  saveError.value = "";
  editing.value = true;
}

async function saveProfile() {
  saveError.value = "";
  try {
    await api.updateProfile({ username: form.username.trim().toLowerCase(), display_name: form.display_name.trim(), bio: form.bio.trim() });
    await refreshProfile();
    editing.value = false;
    const url = new URL(window.location.href);
    url.searchParams.set("u", form.username.trim().toLowerCase());
    history.replaceState(null, "", url);
    await load();
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : String(e);
  }
}
</script>

<template>
  <div class="fet-profile">
    <p v-if="state === 'loading'" class="fet-muted">{{ s.common.loading }}</p>
    <p v-else-if="state === 'missing'" class="fet-callout">{{ isConfigured ? s.profile.notFound : s.common.notConfigured }}</p>
    <p v-else-if="state === 'error'" class="fet-alert">{{ s.common.error }}: {{ error }}</p>
    <div v-else-if="state === 'login'" class="fet-callout">
      <span>{{ s.auth.needLogin }}</span>
      <div class="fet-toolbar">
        <button class="fet-btn fet-btn--small" @click="signIn('github')">{{ s.auth.withGithub }}</button>
        <button class="fet-btn fet-btn--small fet-btn--ghost" @click="signIn('google')">{{ s.auth.withGoogle }}</button>
      </div>
    </div>

    <template v-else-if="profile">
      <div class="fet-profile__header">
        <UserAvatar :name="profile.display_name || profile.username" :src="profile.avatar_url" :size="72" />
        <div>
          <h1>{{ profile.display_name || profile.username }}</h1>
          <p class="fet-muted">@{{ profile.username }} · {{ s.profile.joined }} {{ formatDate(profile.created_at, lang) }}</p>
          <p v-if="profile.bio">{{ profile.bio }}</p>
        </div>
        <span class="spacer" />
        <button v-if="isMe && !editing" class="fet-btn fet-btn--small fet-btn--ghost" @click="startEdit">{{ s.profile.edit }}</button>
      </div>

      <form v-if="editing" class="fet-form" @submit.prevent="saveProfile">
        <label class="fet-field">
          <span>{{ s.profile.username }}</span>
          <input v-model="form.username" required pattern="[a-z0-9][a-z0-9_\-]{2,29}" />
          <small class="fet-muted">{{ s.profile.usernameHint }}</small>
        </label>
        <label class="fet-field">
          <span>{{ s.profile.displayName }}</span>
          <input v-model="form.display_name" maxlength="60" />
        </label>
        <label class="fet-field">
          <span>{{ s.profile.bio }}</span>
          <textarea v-model="form.bio" rows="3" maxlength="280" />
        </label>
        <div class="fet-toolbar">
          <button class="fet-btn fet-btn--small" type="submit">{{ s.common.save }}</button>
          <button class="fet-btn fet-btn--small fet-btn--ghost" type="button" @click="editing = false">{{ s.common.cancel }}</button>
          <span v-if="saveError" class="fet-error">{{ saveError }}</span>
        </div>
      </form>

      <h2>{{ s.profile.progress }} ({{ doneCount }}/{{ stages.length }})</h2>
      <div class="fet-progress-bar" role="progressbar" :aria-valuenow="doneCount" aria-valuemin="0" :aria-valuemax="stages.length">
        <span :style="{ width: `${(doneCount / stages.length) * 100}%` }" />
      </div>
      <div class="fet-stage-grid fet-stage-grid--compact">
        <a v-for="st in stages" :key="st.slug" class="fet-stage-card" :href="href(isMe ? paths(lang).room(st.slug) : paths(lang).stage(st.slug))">
          <span class="fet-stage-card__num">{{ st.slug.slice(0, 2) }}</span>
          <span class="fet-stage-card__title">{{ st.title }}</span>
          <span class="fet-badge" :data-status="statuses[st.slug] ?? 'not-started'">{{ s.status[statuses[st.slug] ?? "not-started"] }}</span>
        </a>
      </div>

      <h2>{{ s.profile.posts }}</h2>
      <p v-if="!posts.length" class="fet-muted">{{ s.profile.noPosts }}</p>
      <div class="fet-feed">
        <PostCard v-for="p in posts" :key="p.id" :post="p" />
      </div>
    </template>
  </div>
</template>
