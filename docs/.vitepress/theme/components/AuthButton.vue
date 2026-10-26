<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import UserAvatar from "./UserAvatar.vue";
import { isConfigured, session, signIn, signOut } from "../lib/supabase";
import { href, paths } from "../lib/routes";
import { useLang } from "../lib/useLang";

const { lang, s } = useLang();
const open = ref(false);
const root = ref<HTMLElement>();

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}
onMounted(() => document.addEventListener("click", onDocClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));
</script>

<template>
  <div v-if="isConfigured && session.ready" ref="root" class="fet-auth">
    <button
      v-if="!session.user"
      class="fet-btn fet-btn--small"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ s.auth.signIn }}
    </button>
    <button v-else class="fet-auth__me" :aria-expanded="open" :aria-label="s.auth.myProfile" @click="open = !open">
      <UserAvatar :name="session.profile?.display_name || session.profile?.username || '?'" :src="session.profile?.avatar_url" :size="28" />
    </button>

    <div v-if="open" class="fet-menu" role="menu">
      <template v-if="!session.user">
        <button role="menuitem" @click="signIn('github')">{{ s.auth.withGithub }}</button>
        <button role="menuitem" @click="signIn('google')">{{ s.auth.withGoogle }}</button>
      </template>
      <template v-else>
        <div class="fet-menu__header">
          <strong>{{ session.profile?.display_name }}</strong>
          <span class="fet-muted">@{{ session.profile?.username }}</span>
        </div>
        <a role="menuitem" :href="href(paths(lang).profile(session.profile?.username))">{{ s.auth.myProfile }}</a>
        <a role="menuitem" :href="href(paths(lang).room())">{{ s.auth.myRoom }}</a>
        <button role="menuitem" @click="signOut().then(() => (open = false))">{{ s.auth.signOut }}</button>
      </template>
    </div>
  </div>
</template>
