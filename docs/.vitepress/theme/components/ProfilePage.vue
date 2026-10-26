<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import UserAvatar from "./UserAvatar.vue";
import PostCard from "./PostCard.vue";
import Icon from "./Icon.vue";
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
const learningCount = computed(() => Object.values(statuses.value).filter((x) => x === "in-progress").length);

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
      <div class="fet-row">
        <button class="fet-btn fet-btn--sm" @click="signIn('github')"><Icon name="github" /> GitHub</button>
        <button class="fet-btn fet-btn--sm fet-btn--ghost" @click="signIn('google')"><Icon name="mail" /> Google</button>
      </div>
    </div>

    <template v-else-if="profile">
      <section class="fet-card">
        <div class="fet-profile__card">
          <UserAvatar :name="profile.display_name || profile.username" :src="profile.avatar_url" :size="72" />
          <div class="fet-profile__info">
            <h1>{{ profile.display_name || profile.username }}</h1>
            <p class="fet-muted fet-small">@{{ profile.username }} · {{ s.profile.joined }} {{ formatDate(profile.created_at, lang) }}</p>
            <p v-if="profile.bio" class="fet-profile__bio">{{ profile.bio }}</p>
          </div>
          <div class="fet-profile__actions">
            <a class="fet-btn fet-btn--sm fet-btn--soft" :href="href(paths(lang).evidence(profile.username))"><Icon name="award" /> {{ s.evidence.open }}</a>
            <button v-if="isMe && !editing" class="fet-btn fet-btn--sm fet-btn--ghost" @click="startEdit"><Icon name="pencil" /> {{ s.profile.edit }}</button>
          </div>
        </div>

        <form v-if="editing" class="fet-form" style="margin-top: 20px" @submit.prevent="saveProfile">
          <label class="fet-field">
            <span>{{ s.profile.username }}</span>
            <input v-model="form.username" required pattern="[a-z0-9][a-z0-9_\-]{2,29}" autocapitalize="off" />
            <small>{{ s.profile.usernameHint }}</small>
          </label>
          <label class="fet-field">
            <span>{{ s.profile.displayName }}</span>
            <input v-model="form.display_name" maxlength="60" />
          </label>
          <label class="fet-field">
            <span>{{ s.profile.bio }}</span>
            <textarea v-model="form.bio" rows="3" maxlength="280" />
          </label>
          <div class="fet-form__actions">
            <span v-if="saveError" class="note fet-error">{{ saveError }}</span>
            <button class="fet-btn fet-btn--ghost" type="button" @click="editing = false">{{ s.common.cancel }}</button>
            <button class="fet-btn" type="submit">{{ s.common.save }}</button>
          </div>
        </form>

        <div class="fet-stats">
          <div><strong>{{ doneCount }}/{{ stages.length }}</strong>{{ s.profile.statDone }}</div>
          <div><strong>{{ learningCount }}</strong>{{ s.profile.statLearning }}</div>
          <div><strong>{{ posts.length }}</strong>{{ s.profile.posts }}</div>
        </div>
      </section>

      <h2>{{ s.profile.progress }}</h2>
      <div class="fet-progress-bar" role="progressbar" :aria-valuenow="doneCount" aria-valuemin="0" :aria-valuemax="stages.length" style="margin-bottom: 14px">
        <span :style="{ width: `${(doneCount / stages.length) * 100}%` }" />
      </div>
      <ul class="fet-stage-list">
        <li v-for="st in stages" :key="st.slug">
          <a class="fet-stage-item" :data-status="statuses[st.slug] ?? 'not-started'" :href="href(isMe ? paths(lang).room(st.slug) : paths(lang).stage(st.slug))">
            <span class="fet-stage-item__num">
              <Icon v-if="statuses[st.slug] === 'done'" name="check" :size="15" />
              <template v-else>{{ st.slug.slice(0, 2) }}</template>
            </span>
            <span class="fet-stage-item__title">{{ st.title }}</span>
            <span class="fet-stage-item__status">{{ s.status[statuses[st.slug] ?? "not-started"] }}</span>
          </a>
        </li>
      </ul>

      <h2>{{ s.profile.posts }}</h2>
      <p v-if="!posts.length" class="fet-muted fet-small">{{ s.profile.noPosts }}</p>
      <div class="fet-feed">
        <PostCard v-for="p in posts" :key="p.id" :post="p" />
      </div>
    </template>
  </div>
</template>
