<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import * as drive from "../lib/drive";
import { useLang } from "../lib/useLang";

const props = defineProps<{ stage: string }>();
const emit = defineEmits<{ use: [url: string] }>();
const { s } = useLang();

interface Recording {
  id: number;
  url: string;
  blob: Blob;
  name: string;
  duration: number;
  driveId?: string;
  driveLink?: string;
  uploading?: boolean;
  error?: string;
}

const supported =
  typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
const mode = ref<"camera" | "screen">("camera");
const recording = ref(false);
const elapsed = ref(0);
const error = ref("");
const live = ref<HTMLVideoElement>();
const recordings = ref<Recording[]>([]);

let stream: MediaStream | null = null;
let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let tick: ReturnType<typeof setInterval> | undefined;
let nextId = 1;

function pickMime(): string {
  const options = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
}

async function getStream(): Promise<MediaStream> {
  if (mode.value === "camera") {
    return navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: true });
  }
  const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  try {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
    mic.getAudioTracks().forEach((track) => screen.addTrack(track));
  } catch {
    // Tanpa mikrofon pun tetap bisa merekam layar.
  }
  return screen;
}

async function start() {
  error.value = "";
  try {
    stream = await getStream();
  } catch {
    error.value = s.value.video.denied;
    return;
  }
  if (live.value) {
    live.value.srcObject = stream;
    void live.value.play();
  }
  const mimeType = pickMime();
  recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = finish;
  // Kalau user menghentikan share layar dari browser, ikut berhenti.
  stream.getVideoTracks()[0]?.addEventListener("ended", stop);
  recorder.start(1000);
  recording.value = true;
  elapsed.value = 0;
  tick = setInterval(() => elapsed.value++, 1000);
}

function stop() {
  if (recorder && recorder.state !== "inactive") recorder.stop();
}

function finish() {
  clearInterval(tick);
  recording.value = false;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  if (live.value) live.value.srcObject = null;
  const type = recorder?.mimeType || "video/webm";
  const blob = new Blob(chunks, { type });
  const ext = type.includes("mp4") ? "mp4" : "webm";
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  recordings.value.unshift({
    id: nextId++,
    url: URL.createObjectURL(blob),
    blob,
    name: `${props.stage}-${stamp}.${ext}`,
    duration: elapsed.value,
  });
}

async function toDrive(rec: Recording) {
  rec.error = "";
  rec.uploading = true;
  try {
    if (!drive.isConnected()) await drive.connect();
    const file = await drive.uploadVideo(props.stage, rec.blob, rec.name);
    rec.driveId = file.id;
    rec.driveLink = file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view`;
  } catch (e) {
    rec.error = e instanceof Error ? e.message : String(e);
  } finally {
    rec.uploading = false;
  }
}

// Video baru dibuka untuk "siapa saja yang punya link" saat user memilih
// memakainya di postingan komunitas, bukan saat disimpan.
async function useInPost(rec: Recording) {
  rec.error = "";
  try {
    if (rec.driveId) await drive.shareWithLink(rec.driveId);
    emit("use", rec.driveLink!);
  } catch (e) {
    rec.error = e instanceof Error ? e.message : String(e);
  }
}

function remove(rec: Recording) {
  URL.revokeObjectURL(rec.url);
  recordings.value = recordings.value.filter((r) => r !== rec);
}

function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

onBeforeUnmount(() => {
  stop();
  stream?.getTracks().forEach((t) => t.stop());
  recordings.value.forEach((r) => URL.revokeObjectURL(r.url));
});
</script>

<template>
  <div class="fet-recorder">
    <p>{{ s.video.why }}</p>
    <p class="fet-muted">{{ s.video.ideas }}</p>
    <ul class="fet-muted">
      <li v-for="idea in s.video.ideaList" :key="idea">{{ idea }}</li>
    </ul>

    <p v-if="!supported" class="fet-alert">{{ s.video.unsupported }}</p>
    <template v-else>
      <div class="fet-toolbar">
        <div class="fet-segmented" role="radiogroup">
          <button role="radio" :aria-checked="mode === 'camera'" :class="{ active: mode === 'camera' }" :disabled="recording" @click="mode = 'camera'">
            🎥 {{ s.video.camera }}
          </button>
          <button role="radio" :aria-checked="mode === 'screen'" :class="{ active: mode === 'screen' }" :disabled="recording" @click="mode = 'screen'">
            🖥️ {{ s.video.screen }}
          </button>
        </div>
        <button v-if="!recording" class="fet-btn" @click="start">● {{ s.video.start }}</button>
        <button v-else class="fet-btn fet-btn--danger" @click="stop">■ {{ s.video.stop }} ({{ mmss(elapsed) }})</button>
      </div>
      <p v-if="error" class="fet-alert">{{ error }}</p>
      <video v-show="recording" ref="live" class="fet-recorder__live" muted playsinline />
    </template>

    <p v-if="!drive.isConfigured" class="fet-muted fet-small">{{ s.video.driveOff }}</p>
    <p v-else class="fet-muted fet-small">{{ s.video.drivePrivacy }}</p>

    <h4>{{ s.video.recordings }}</h4>
    <p v-if="!recordings.length" class="fet-muted">{{ s.video.none }}</p>
    <div v-for="rec in recordings" :key="rec.id" class="fet-recording">
      <video :src="rec.url" controls playsinline />
      <div class="fet-recording__meta">
        <strong>{{ rec.name }}</strong>
        <span class="fet-muted">{{ mmss(rec.duration) }}</span>
        <div class="fet-toolbar">
          <a class="fet-btn fet-btn--small fet-btn--ghost" :href="rec.url" :download="rec.name">⬇ {{ s.video.download }}</a>
          <button
            v-if="drive.isConfigured && !rec.driveLink"
            class="fet-btn fet-btn--small"
            :disabled="rec.uploading"
            @click="toDrive(rec)"
          >
            {{ rec.uploading ? s.video.uploading : s.video.toDrive }}
          </button>
          <a v-if="rec.driveLink" class="fet-btn fet-btn--small fet-btn--ghost" :href="rec.driveLink" target="_blank" rel="noopener">
            ✓ {{ s.video.inDrive }}
          </a>
          <button v-if="rec.driveLink" class="fet-btn fet-btn--small" @click="useInPost(rec)">
            {{ s.video.useInPost }}
          </button>
          <button class="fet-btn fet-btn--small fet-btn--ghost" @click="remove(rec)">{{ s.common.delete }}</button>
        </div>
        <p v-if="rec.error" class="fet-alert">{{ rec.error }}</p>
      </div>
    </div>
  </div>
</template>
