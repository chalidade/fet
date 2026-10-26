<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { EditorView } from "@codemirror/view";

const props = defineProps<{
  modelValue: string;
  language: "html" | "css" | "js" | "md";
  readonly?: boolean;
  label: string;
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const host = ref<HTMLDivElement>();
let view: EditorView | null = null;

onMounted(async () => {
  // Dimuat dinamis supaya CodeMirror tidak ikut ke bundle halaman lain dan aman untuk SSR.
  const [{ basicSetup }, { EditorView: View }, { EditorState }, langs, { oneDark }] = await Promise.all([
    import("codemirror"),
    import("@codemirror/view"),
    import("@codemirror/state"),
    Promise.all([
      import("@codemirror/lang-html"),
      import("@codemirror/lang-css"),
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-markdown"),
    ]),
    import("@codemirror/theme-one-dark"),
  ]);
  const [html, css, js, md] = langs;
  const language = { html: html.html(), css: css.css(), js: js.javascript(), md: md.markdown() }[props.language];
  const dark = document.documentElement.classList.contains("dark");

  view = new View({
    parent: host.value!,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        language,
        View.lineWrapping,
        EditorState.readOnly.of(!!props.readonly),
        View.contentAttributes.of({ "aria-label": props.label }),
        ...(dark ? [oneDark] : []),
        View.updateListener.of((u) => {
          if (u.docChanged) emit("update:modelValue", u.state.doc.toString());
        }),
      ],
    }),
  });
});

watch(
  () => props.modelValue,
  (value) => {
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  },
);

onBeforeUnmount(() => view?.destroy());
</script>

<template>
  <div ref="host" class="fet-editor" />
</template>
