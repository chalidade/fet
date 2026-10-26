<script setup lang="ts">
import DropMenu from "./DropMenu.vue";
import Icon from "./Icon.vue";
import UserAvatar from "./UserAvatar.vue";
import { isConfigured, session, signIn, signOut } from "../lib/supabase";
import { href, paths } from "../lib/routes";
import { useLang } from "../lib/useLang";

const { lang, s } = useLang();
</script>

<template>
  <div v-if="isConfigured && session.ready" class="fet-auth">
    <DropMenu v-if="!session.user" :label="s.auth.signIn">
      <template #trigger><span class="fet-btn fet-btn--sm">{{ s.auth.signIn }}</span></template>
      <button role="menuitem" @click="signIn('github')"><Icon name="github" /> {{ s.auth.withGithub }}</button>
      <button role="menuitem" @click="signIn('google')"><Icon name="mail" /> {{ s.auth.withGoogle }}</button>
    </DropMenu>
    <DropMenu v-else :label="s.auth.myProfile">
      <template #trigger>
        <UserAvatar :name="session.profile?.display_name || session.profile?.username || '?'" :src="session.profile?.avatar_url" :size="30" />
      </template>
      <div class="fet-menu__header">
        <strong>{{ session.profile?.display_name }}</strong>
        <span class="fet-muted fet-small">@{{ session.profile?.username }}</span>
      </div>
      <a role="menuitem" :href="href(paths(lang).profile(session.profile?.username))"><Icon name="user" /> {{ s.auth.myProfile }}</a>
      <a role="menuitem" :href="href(paths(lang).room())"><Icon name="code" /> {{ s.auth.myRoom }}</a>
      <hr />
      <button role="menuitem" @click="signOut()"><Icon name="logout" /> {{ s.auth.signOut }}</button>
    </DropMenu>
  </div>
</template>
