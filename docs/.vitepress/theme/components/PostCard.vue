<script setup lang="ts">
import { computed } from "vue";
import UserAvatar from "./UserAvatar.vue";
import Icon from "./Icon.vue";
import type { FeedPost } from "../lib/api";
import { findStage } from "../../stages";
import { formatDate } from "../lib/i18n";
import { renderMarkdown } from "../lib/markdown";
import { href, paths } from "../lib/routes";
import { useLang } from "../lib/useLang";

const props = defineProps<{ post: FeedPost }>();
const { lang, s } = useLang();

// Ringkasan berupa teks polos dari Markdown yang sudah dirender (HTML user sudah di-escape).
const excerpt = computed(() => {
  const html = renderMarkdown(props.post.body.slice(0, 2000));
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  const plain = text.replace(/\s+/g, " ").trim();
  return plain.length > 220 ? plain.slice(0, 220) + "…" : plain;
});
const stage = computed(() => findStage(props.post.stage));
</script>

<template>
  <article class="fet-post-card">
    <div class="fet-post-card__head">
      <a :href="href(paths(lang).profile(post.username))" class="fet-author">
        <UserAvatar :name="post.display_name || post.username" :src="post.avatar_url" :size="24" />
        <span>{{ post.display_name || post.username }}</span>
      </a>
      <span class="fet-muted">· {{ formatDate(post.created_at, lang) }}</span>
    </div>
    <a :href="href(paths(lang).post(post.id))" class="fet-post-card__title">{{ post.title }}</a>
    <p v-if="excerpt" class="fet-post-card__excerpt">{{ excerpt }}</p>
    <div class="fet-post-card__foot">
      <a v-if="stage" class="fet-chip" :href="href(paths(lang).community(stage.slug))">{{ stage.slug.slice(0, 2) }} · {{ stage.title }}</a>
      <span v-if="post.video_url" class="fet-meta-item" :title="s.room.tabs.video"><Icon name="video" :size="14" /></span>
      <span v-if="post.code" class="fet-meta-item" :title="s.room.tabs.code"><Icon name="code" :size="14" /></span>
      <span class="spacer" />
      <span class="fet-meta-item" :title="s.community.like"><Icon name="heart" :size="14" /> {{ post.reaction_count }}</span>
      <span class="fet-meta-item" :title="s.community.comments"><Icon name="comment" :size="14" /> {{ post.comment_count }}</span>
    </div>
  </article>
</template>
