<script setup lang="ts">
import { ref, watch } from "vue";
import CodeEditor from "./CodeEditor.vue";
import Icon from "./Icon.vue";
import type { Code } from "../lib/api";
import { useLang } from "../lib/useLang";

const props = defineProps<{ modelValue: Code; readonly?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: Code] }>();
const { s } = useLang();

type Tab = "html" | "css" | "js";
const tab = ref<Tab>("html");
// Di layar sempit editor dan hasil ditampilkan bergantian.
const view = ref<"code" | "preview">("code");
const autoRun = ref(true);
const srcdoc = ref("");

function build(code: Code): string {
  // Script dijalankan di iframe sandbox tanpa allow-same-origin: tidak bisa
  // mengakses cookie, storage, atau sesi login situs ini.
  const safeJs = code.js.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${code.css}</style></head><body>${code.html}<script>${safeJs}<\/script></body></html>`;
}

function run() {
  srcdoc.value = build(props.modelValue);
}

function runAndShow() {
  run();
  view.value = "preview";
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

const tabs = [
  { key: "html" as const, label: "HTML" },
  { key: "css" as const, label: "CSS" },
  { key: "js" as const, label: "JS" },
];
</script>

<template>
  <div class="fet-pg" :data-view="view">
    <div class="fet-pg__view">
      <div class="fet-seg" role="tablist">
        <button role="tab" :aria-selected="view === 'code'" :class="{ active: view === 'code' }" @click="view = 'code'">
          <Icon name="code" /> {{ s.room.viewCode }}
        </button>
        <button role="tab" :aria-selected="view === 'preview'" :class="{ active: view === 'preview' }" @click="runAndShow">
          <Icon name="eye" /> {{ s.room.viewPreview }}
        </button>
      </div>
    </div>

    <div class="fet-pg__panes">
      <section class="fet-pane fet-pane--code">
        <div class="fet-pane__bar">
          <div class="fet-filetabs" role="tablist">
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
      </section>

      <section class="fet-pane fet-pane--preview">
        <div class="fet-pane__bar">
          <span class="fet-pane__title">{{ s.room.viewPreview }}</span>
          <span class="spacer" />
          <label class="fet-toggle"><input v-model="autoRun" type="checkbox" /> {{ s.room.autoRun }}</label>
          <button class="fet-btn fet-btn--sm" @click="run"><Icon name="play" :size="14" /> {{ s.room.run }}</button>
        </div>
        <iframe title="Preview" sandbox="allow-scripts allow-modals" :srcdoc="srcdoc" />
      </section>
    </div>
  </div>
</template>
