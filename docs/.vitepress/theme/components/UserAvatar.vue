<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ name: string; src?: string | null; size?: number }>();
const initial = computed(() => (props.name.trim()[0] ?? "?").toUpperCase());
</script>

<template>
  <img
    v-if="src"
    class="fet-avatar"
    :src="src"
    :alt="name"
    :width="size ?? 32"
    :height="size ?? 32"
    referrerpolicy="no-referrer"
  />
  <span v-else class="fet-avatar fet-avatar--fallback" :style="{ width: `${size ?? 32}px`, height: `${size ?? 32}px` }" aria-hidden="true">
    {{ initial }}
  </span>
</template>
