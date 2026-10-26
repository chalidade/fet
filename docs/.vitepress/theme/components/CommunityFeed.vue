<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import PostCard from "./PostCard.vue";
import Icon from "./Icon.vue";
import { stages } from "../../stages";
import { isConfigured } from "../lib/supabase";
import { listPosts, PAGE_SIZE, type FeedPost } from "../lib/api";
import { href, paths, query } from "../lib/routes";
import { useLang } from "../lib/useLang";

const { lang, s } = useLang();
const stage = ref("");
const posts = ref<FeedPost[]>([]);
const loading = ref(false);
const more = ref(false);
const error = ref("");

async function load(append = false) {
  if (!isConfigured) return;
  loading.value = true;
  error.value = "";
  try {
    const before = append ? posts.value.at(-1)?.created_at : undefined;
    const page = await listPosts({ stage: stage.value || undefined, before });
    posts.value = append ? [...posts.value, ...page] : page;
    more.value = page.length === PAGE_SIZE;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  stage.value = query("tahap") ?? "";
  void load();
});

watch(stage, (value) => {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("tahap", value);
  else url.searchParams.delete("tahap");
  history.replaceState(null, "", url);
  void load();
});
</script>

<template>
  <div class="fet-community">
    <header class="fet-page-head">
      <div>
        <h1>{{ s.community.title }}</h1>
        <p class="fet-lead">{{ s.community.intro }}</p>
      </div>
      <a v-if="isConfigured" class="fet-btn" :href="href(paths(lang).room(stage || undefined))">
        <Icon name="plus" /> {{ s.community.shareCta }}
      </a>
    </header>

    <p v-if="!isConfigured" class="fet-callout">{{ s.common.notConfigured }}</p>
    <template v-else>
      <div class="fet-filter">
        <label class="sr-only" for="fet-stage-filter">{{ s.common.stage }}</label>
        <select id="fet-stage-filter" v-model="stage" class="fet-select">
          <option value="">{{ s.common.allStages }}</option>
          <option v-for="st in stages" :key="st.slug" :value="st.slug">{{ st.slug.slice(0, 2) }} · {{ st.title }}</option>
        </select>
      </div>

      <p v-if="error" class="fet-alert">
        {{ s.common.error }}: {{ error }} <button class="fet-link" @click="load()">{{ s.common.retry }}</button>
      </p>
      <div v-if="!loading && !error && !posts.length" class="fet-empty">
        <Icon name="users" :size="28" />
        <span>{{ s.community.empty }}</span>
      </div>
      <div class="fet-feed">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
      </div>
      <p v-if="loading" class="fet-muted">{{ s.common.loading }}</p>
      <div v-if="more && !loading" style="text-align: center; margin-top: 16px">
        <button class="fet-btn fet-btn--ghost" @click="load(true)">{{ s.common.loadMore }}</button>
      </div>
    </template>
  </div>
</template>
