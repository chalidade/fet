<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import UserAvatar from "./UserAvatar.vue";
import CodePlayground from "./CodePlayground.vue";
import DropMenu from "./DropMenu.vue";
import Icon from "./Icon.vue";
import { findStage } from "../../stages";
import { isConfigured, session, signIn } from "../lib/supabase";
import * as api from "../lib/api";
import { embedUrl, renderMarkdown } from "../lib/markdown";
import { formatDate } from "../lib/i18n";
import { href, paths, query } from "../lib/routes";
import { useLang } from "../lib/useLang";

const { lang, s } = useLang();
const post = ref<api.FeedPost | null>(null);
const comments = ref<api.Comment[]>([]);
const state = ref<"loading" | "ready" | "missing" | "error">("loading");
const error = ref("");
const reacted = ref(false);
const commentBody = ref("");
const sending = ref(false);
const confirmDelete = ref(false);

const stage = computed(() => findStage(post.value?.stage));
const video = computed(() => embedUrl(post.value?.video_url));
const isMine = computed(() => !!session.user && post.value?.user_id === session.user.id);

async function load() {
  const id = query("id");
  if (!isConfigured || !id) {
    state.value = "missing";
    return;
  }
  try {
    post.value = await api.getPost(id);
    if (!post.value) {
      state.value = "missing";
      return;
    }
    comments.value = await api.listComments(id);
    state.value = "ready";
  } catch (e) {
    state.value = "error";
    error.value = e instanceof Error ? e.message : String(e);
  }
}

onMounted(load);

watch(
  [post, () => session.user?.id],
  async ([p]) => {
    reacted.value = p ? await api.hasReacted(p.id).catch(() => false) : false;
  },
);

async function toggleLike() {
  if (!post.value) return;
  if (!session.user) return signIn("github");
  const next = !reacted.value;
  reacted.value = next;
  post.value.reaction_count += next ? 1 : -1;
  try {
    await api.toggleReaction(post.value.id, next);
  } catch {
    reacted.value = !next;
    post.value.reaction_count += next ? -1 : 1;
  }
}

async function send() {
  if (!post.value || !commentBody.value.trim()) return;
  sending.value = true;
  try {
    await api.addComment(post.value.id, commentBody.value.trim());
    commentBody.value = "";
    comments.value = await api.listComments(post.value.id);
    post.value.comment_count = comments.value.length;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    sending.value = false;
  }
}

async function removeComment(c: api.Comment) {
  await api.deleteComment(c.id);
  comments.value = comments.value.filter((x) => x.id !== c.id);
}

async function removePost(e: MouseEvent) {
  if (!post.value) return;
  if (!confirmDelete.value) {
    e.stopPropagation();
    confirmDelete.value = true;
    setTimeout(() => (confirmDelete.value = false), 3000);
    return;
  }
  await api.deletePost(post.value.id);
  window.location.href = href(paths(lang.value).community());
}
</script>

<template>
  <article class="fet-post">
    <a class="fet-link fet-link--muted fet-small" :href="href(paths(lang).community())">
      <Icon name="arrow-left" :size="14" /> {{ s.community.back }}
    </a>

    <p v-if="state === 'loading'" class="fet-muted">{{ s.common.loading }}</p>
    <p v-else-if="state === 'missing'" class="fet-callout">{{ isConfigured ? s.community.notFound : s.common.notConfigured }}</p>
    <p v-else-if="state === 'error'" class="fet-alert">{{ s.common.error }}: {{ error }}</p>

    <template v-else-if="post">
      <header class="fet-post__head">
        <div v-if="stage"><a class="fet-chip" :href="href(paths(lang).stage(stage.slug))">{{ stage.slug.slice(0, 2) }} · {{ stage.title }}</a></div>
        <h1>{{ post.title }}</h1>
        <div class="fet-post__byline">
          <a :href="href(paths(lang).profile(post.username))" class="fet-author">
            <UserAvatar :name="post.display_name || post.username" :src="post.avatar_url" :size="36" />
          </a>
          <div class="who">
            <a :href="href(paths(lang).profile(post.username))" class="fet-author">{{ post.display_name || post.username }}</a>
            <span class="fet-muted fet-small">{{ formatDate(post.created_at, lang) }}</span>
          </div>
          <span class="spacer" />
          <DropMenu v-if="isMine" :label="s.community.postActions">
            <template #trigger><span class="fet-icon-btn"><Icon name="more" /></span></template>
            <button role="menuitem" class="is-danger" @click="removePost">
              <Icon name="trash" /> {{ confirmDelete ? s.common.confirmDelete : s.community.deletePost }}
            </button>
          </DropMenu>
        </div>
      </header>

      <div v-if="video" class="fet-video">
        <iframe :src="video" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen />
      </div>
      <p v-else-if="post.video_url">
        <a class="fet-btn fet-btn--ghost" :href="post.video_url" target="_blank" rel="noopener noreferrer nofollow">
          <Icon name="video" /> {{ s.community.openVideo }}
        </a>
      </p>

      <!-- renderMarkdown memakai markdown-it dengan html: false, jadi input user di-escape. -->
      <div class="vp-doc fet-markdown" v-html="renderMarkdown(post.body)" />

      <template v-if="post.code">
        <h2>{{ s.community.code }}</h2>
        <CodePlayground :model-value="post.code" readonly />
      </template>

      <div class="fet-post__actions">
        <button class="fet-btn fet-btn--ghost" :class="{ active: reacted }" :aria-pressed="reacted" @click="toggleLike">
          <Icon name="heart" /> {{ s.community.like }} · {{ post.reaction_count }}
        </button>
        <span class="fet-meta-item fet-muted fet-small"><Icon name="comment" :size="14" /> {{ comments.length }}</span>
      </div>

      <section class="fet-comments">
        <h2>{{ s.community.comments }}</h2>
        <p v-if="!comments.length" class="fet-muted fet-small">{{ s.community.noComments }}</p>
        <div v-for="c in comments" :key="c.id" class="fet-comment">
          <UserAvatar v-if="c.profiles" :name="c.profiles.display_name || c.profiles.username" :src="c.profiles.avatar_url" :size="32" />
          <span v-else />
          <div>
            <div class="fet-comment__head">
              <a v-if="c.profiles" :href="href(paths(lang).profile(c.profiles.username))" class="fet-author">
                {{ c.profiles.display_name || c.profiles.username }}
              </a>
              <span class="fet-muted">{{ formatDate(c.created_at, lang) }}</span>
              <span class="spacer" />
              <button v-if="session.user?.id === c.user_id" class="fet-link fet-link--muted fet-small" @click="removeComment(c)">{{ s.common.delete }}</button>
            </div>
            <div class="vp-doc fet-markdown" v-html="renderMarkdown(c.body)" />
          </div>
        </div>

        <div v-if="session.user" class="fet-composer">
          <UserAvatar :name="session.profile?.display_name || session.profile?.username || '?'" :src="session.profile?.avatar_url" :size="32" />
          <form class="fet-form" @submit.prevent="send">
            <textarea v-model="commentBody" rows="3" maxlength="5000" :placeholder="s.community.writeComment" />
            <div class="fet-form__actions">
              <button class="fet-btn fet-btn--sm" type="submit" :disabled="sending || !commentBody.trim()"><Icon name="send" /> {{ s.community.send }}</button>
            </div>
          </form>
        </div>
        <div v-else class="fet-callout">
          <span>{{ s.auth.needLogin }}</span>
          <div class="fet-row">
            <button class="fet-btn fet-btn--sm" @click="signIn('github')"><Icon name="github" /> GitHub</button>
            <button class="fet-btn fet-btn--sm fet-btn--ghost" @click="signIn('google')"><Icon name="mail" /> Google</button>
          </div>
        </div>
      </section>
    </template>
  </article>
</template>
