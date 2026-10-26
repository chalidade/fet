<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import * as drive from "../lib/drive";
import Icon from "./Icon.vue";
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
    <div class="fet-rec">
      <div>
        <div class="fet-rec__stage">
          <video v-show="recording" ref="live" muted playsinline />
          <div v-if="!recording" class="fet-rec__placeholder">
            <Icon :name="mode === 'camera' ? 'video' : 'monitor'" :size="32" />
            <span>{{ supported ? s.video.preview : s.video.unsupported }}</span>
          </div>
          <span v-if="recording" class="fet-rec__timer">{{ mmss(elapsed) }}</span>
        </div>
        <div v-if="supported" class="fet-rec__controls">
          <div class="fet-seg" role="radiogroup">
            <button role="radio" :aria-checked="mode === 'camera'" :class="{ active: mode === 'camera' }" :disabled="recording" @click="mode = 'camera'">
              <Icon name="video" /> {{ s.video.camera }}
            </button>
            <button role="radio" :aria-checked="mode === 'screen'" :class="{ active: mode === 'screen' }" :disabled="recording" @click="mode = 'screen'">
              <Icon name="monitor" /> {{ s.video.screen }}
            </button>
          </div>
          <button v-if="!recording" class="fet-rec__btn" @click="start"><span class="dot" /> {{ s.video.start }}</button>
          <button v-else class="fet-rec__btn recording" @click="stop"><span class="dot" /> {{ s.video.stop }} · {{ mmss(elapsed) }}</button>
        </div>
        <p v-if="error" class="fet-alert">{{ error }}</p>
      </div>

      <aside class="fet-card fet-rec__tips">
        <h3>{{ s.video.ideas }}</h3>
        <p class="fet-muted fet-small">{{ s.video.why }}</p>
        <ul>
          <li v-for="idea in s.video.ideaList" :key="idea">{{ idea }}</li>
        </ul>
        <p class="fet-hint" style="margin: 16px 0 0">
          <Icon name="cloud" /> {{ drive.isConfigured ? s.video.drivePrivacy : s.video.driveOff }}
        </p>
      </aside>
    </div>

    <template v-if="recordings.length">
      <h3 style="margin: 28px 0 12px">{{ s.video.recordings }}</h3>
      <div class="fet-rec-list">
        <div v-for="rec in recordings" :key="rec.id" class="fet-card fet-rec-item">
          <video :src="rec.url" controls playsinline />
          <div class="fet-rec-item__meta">
            <span class="fet-rec-item__name" :title="rec.name">{{ rec.name }}</span>
            <span class="fet-muted fet-small">{{ mmss(rec.duration) }}</span>
            <div class="fet-row">
              <button
                v-if="drive.isConfigured && !rec.driveLink"
                class="fet-btn fet-btn--sm"
                :disabled="rec.uploading"
                @click="toDrive(rec)"
              >
                <Icon name="cloud" /> {{ rec.uploading ? s.video.uploading : s.video.toDrive }}
              </button>
              <button v-if="rec.driveLink" class="fet-btn fet-btn--sm" @click="useInPost(rec)">
                <Icon name="send" /> {{ s.video.useInPost }}
              </button>
              <a v-if="rec.driveLink" class="fet-btn fet-btn--sm fet-btn--ghost" :href="rec.driveLink" target="_blank" rel="noopener">
                <Icon name="check" /> {{ s.video.inDrive }}
              </a>
              <a class="fet-btn fet-btn--sm fet-btn--ghost" :href="rec.url" :download="rec.name"><Icon name="download" /> {{ s.video.download }}</a>
              <button class="fet-icon-btn" :title="s.common.delete" :aria-label="s.common.delete" @click="remove(rec)"><Icon name="trash" /></button>
            </div>
            <p v-if="rec.error" class="fet-alert">{{ rec.error }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
