<script setup lang="ts">
import { computed } from "vue";
import UserAvatar from "./UserAvatar.vue";
import type { FeedPost } from "../lib/api";
import { findStage } from "../../stages";
import { formatDate } from "../lib/i18n";
import { href, paths } from "../lib/routes";
import { useLang } from "../lib/useLang";

const props = defineProps<{ post: FeedPost }>();
const { lang, s } = useLang();

const excerpt = computed(() => {
  const plain = props.post.body.replace(/[#*_`>\[\]()!-]/g, "").replace(/\s+/g, " ").trim();
  return plain.length > 180 ? plain.slice(0, 180) + "…" : plain;
});
const stage = computed(() => findStage(props.post.stage));
</script>

<template>
  <article class="fet-post-card">
    <header>
      <a :href="href(paths(lang).profile(post.username))" class="fet-author">
        <UserAvatar :name="post.display_name || post.username" :src="post.avatar_url" :size="28" />
        <span>{{ post.display_name || post.username }}</span>
      </a>
      <span class="fet-muted fet-small">{{ formatDate(post.created_at, lang) }}</span>
    </header>
    <a :href="href(paths(lang).post(post.id))" class="fet-post-card__title">{{ post.title }}</a>
    <p v-if="excerpt" class="fet-muted">{{ excerpt }}</p>
    <footer class="fet-small">
      <a v-if="stage" class="fet-chip" :href="href(paths(lang).community(stage.slug))">{{ stage.slug.slice(0, 2) }} · {{ stage.title }}</a>
      <span v-if="post.video_url">🎬</span>
      <span v-if="post.code">💻</span>
      <span>👍 {{ post.reaction_count }}</span>
      <span>💬 {{ post.comment_count }}</span>
      <span class="sr-only">{{ s.community.comments }}</span>
    </footer>
  </article>
</template>
