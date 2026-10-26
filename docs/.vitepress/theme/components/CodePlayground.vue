<script setup lang="ts">
import { computed, ref, watch } from "vue";
import CodeEditor from "./CodeEditor.vue";
import type { Code } from "../lib/api";
import { useLang } from "../lib/useLang";

const props = defineProps<{ modelValue: Code; readonly?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: Code]; reset: [] }>();
const { s } = useLang();

type Tab = "html" | "css" | "js";
const tab = ref<Tab>("html");
const autoRun = ref(true);
const srcdoc = ref("");
const confirmReset = ref(false);

function build(code: Code): string {
  // Script dijalankan di iframe sandbox tanpa allow-same-origin: tidak bisa
  // mengakses cookie, storage, atau sesi login situs ini.
  const safeJs = code.js.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${code.css}</style></head><body>${code.html}<script>${safeJs}<\/script></body></html>`;
}

function run() {
  srcdoc.value = build(props.modelValue);
}

let timer: ReturnType<typeof setTimeout> | undefined;
watch(
  () => props.modelValue,
  () => {
    if (!autoRun.value) return;
    clearTimeout(timer);
    timer = setTimeout(run, 600);
  },
  { deep: true, immediate: true },
);

function update(key: Tab, value: string) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}

function onReset() {
  if (!confirmReset.value) {
    confirmReset.value = true;
    setTimeout(() => (confirmReset.value = false), 3000);
    return;
  }
  confirmReset.value = false;
  emit("reset");
}

const tabs = computed(() => [
  { key: "html" as const, label: "HTML" },
  { key: "css" as const, label: "CSS" },
  { key: "js" as const, label: "JavaScript" },
]);
</script>

<template>
  <div class="fet-playground">
    <div class="fet-playground__editors">
      <div class="fet-tabs" role="tablist">
        <button
          v-for="item in tabs"
          :key="item.key"
          role="tab"
          :aria-selected="tab === item.key"
          :class="{ active: tab === item.key }"
          @click="tab = item.key"
        >
          {{ item.label }}
        </button>
      </div>
      <template v-for="item in tabs" :key="item.key">
        <CodeEditor
          v-show="tab === item.key"
          :model-value="modelValue[item.key]"
          :language="item.key"
          :label="item.label"
          :readonly="readonly"
          @update:model-value="update(item.key, $event)"
        />
      </template>
    </div>
    <div class="fet-playground__preview">
      <div class="fet-toolbar">
        <button class="fet-btn fet-btn--small" @click="run">▶ {{ s.room.run }}</button>
        <label class="fet-check"><input v-model="autoRun" type="checkbox" /> {{ s.room.autoRun }}</label>
        <span class="spacer" />
        <button v-if="!readonly" class="fet-btn fet-btn--small fet-btn--ghost" @click="onReset">
          {{ confirmReset ? s.room.resetConfirm : s.room.resetCode }}
        </button>
      </div>
      <iframe title="Preview" sandbox="allow-scripts allow-modals" :srcdoc="srcdoc" />
    </div>
  </div>
</template>
