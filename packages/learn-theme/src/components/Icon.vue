<script setup lang="ts">
import { paths, type IconName } from "../lib/icons";

defineProps<{ name: IconName; size?: number }>();
</script>

<template>
  <svg
    class="fet-icon"
    :width="size ?? 16"
    :height="size ?? 16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="paths[name]"
  />
</template>
