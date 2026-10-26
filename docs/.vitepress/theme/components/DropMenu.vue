<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

// Menu tarik-turun kecil: tutup saat klik di luar, tekan Escape, atau memilih item.
// Item yang perlu konfirmasi dua kali bisa memberi atribut data-keep-open.
defineProps<{ label: string; align?: "left" | "right" }>();
const open = ref(false);
const root = ref<HTMLElement>();

function onDocClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") open.value = false;
}
function onMenuClick(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest("a, button");
  if (item && !item.hasAttribute("data-keep-open")) open.value = false;
}
onMounted(() => {
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  document.removeEventListener("keydown", onKey);
});
</script>

<template>
  <div ref="root" class="fet-dropdown">
    <button type="button" class="fet-dropdown__trigger" :aria-label="label" :title="label" :aria-expanded="open" aria-haspopup="menu" @click="open = !open">
      <slot name="trigger" />
    </button>
    <div v-if="open" class="fet-menu" :class="{ 'fet-menu--left': align === 'left' }" role="menu" @click="onMenuClick">
      <slot />
    </div>
  </div>
</template>
