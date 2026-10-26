<script setup lang="ts">
import { computed } from "vue";
import { Icon, href, paths, useLang, type IconName } from "@chalidade/learn-theme";
import { phases, stages } from "../../stages";

const { lang } = useLang();

const copy = {
  id: {
    eyebrow: "Open source · Gratis · Bahasa Indonesia & English",
    title: "Belajar front-end sampai paham cara kerjanya.",
    lead: "Roadmap 20 tahap, ruang praktik langsung di browser, dan toolkit yang bisa di-install. Untuk developer yang ingin lebih dari sekadar bisa memakai framework.",
    start: "Mulai belajar",
    roadmap: "Lihat roadmap",
    what: "Apa itu fet?",
    stats: [
      ["20", "tahap materi"],
      ["8", "fase berurutan"],
      ["3", "package toolkit"],
      ["2", "bahasa"],
    ],
    howEyebrow: "Metode",
    howTitle: "Tiga langkah di setiap tahap",
    steps: [
      {
        icon: "book",
        title: "Pahami konsepnya",
        body: "Peta konsep dari dasar sampai deep dive, dengan sumber primer seperti spesifikasi dan source code. Centang yang sudah kamu kuasai.",
        link: "Metode belajar",
        to: "/how-to-learn",
      },
      {
        icon: "code",
        title: "Praktikkan langsung",
        body: "Tulis HTML, CSS, dan JavaScript di Ruang Belajar dan lihat hasilnya seketika. Catatan dan progres tersimpan di akunmu.",
        link: "Buka Ruang Belajar",
        to: "room",
      },
      {
        icon: "video",
        title: "Jelaskan dengan kata-katamu",
        body: "Rekam video penjelasan singkat sebagai bukti belajar, lalu bagikan ke komunitas. Kalau bisa menjelaskan, berarti paham.",
        link: "Lihat komunitas",
        to: "community",
      },
    ],
    roadmapEyebrow: "Roadmap",
    roadmapTitle: "Dari cara kerja internet sampai aplikasi desktop",
    roadmapLead: "Setiap tahap dibangun di atas tahap sebelumnya. Mulai dari fase 1, atau lompat ke topik yang kamu butuhkan.",
    roadmapAll: "Lihat roadmap lengkap",
    toolkitEyebrow: "Toolkit",
    toolkitTitle: "Package kecil yang lahir dari materi",
    toolkitLead: "Tanpa dependensi runtime, teruji, dan source-nya sengaja pendek supaya bisa dibaca sebagai bahan belajar.",
    toolkitAll: "Lihat toolkit",
    packages: [
      ["@chalidade/utils", "debounce, throttle, cx, clamp"],
      ["@chalidade/tokens", "Design tokens dan CSS variables, dengan mode gelap"],
      ["@chalidade/react-hooks", "Hooks yang aman untuk SSR"],
    ],
    ctaTitle: "Mulai dari tahap 01 hari ini.",
    ctaBody: "Masuk dengan GitHub atau Google untuk menyimpan progres, catatan, dan kodemu.",
    ctaCommunity: "Lihat komunitas",
    mock: {
      stage: "Tahap 04 · JavaScript",
      status: "Sedang belajar",
      concepts: ["Scope, hoisting, TDZ", "Closure & garbage collection", "Event loop: task vs microtask"],
      progress: "2 dari 19 konsep",
    },
  },
  en: {
    eyebrow: "Open source · Free · English & Bahasa Indonesia",
    title: "Learn front-end until you understand how it works.",
    lead: "A 20-stage roadmap, a practice room right in your browser, and installable toolkits. For developers who want more than knowing how to use a framework.",
    start: "Start learning",
    roadmap: "See the roadmap",
    what: "What is fet?",
    stats: [
      ["20", "stages"],
      ["8", "ordered phases"],
      ["3", "toolkit packages"],
      ["2", "languages"],
    ],
    howEyebrow: "Method",
    howTitle: "Three steps in every stage",
    steps: [
      {
        icon: "book",
        title: "Understand the concepts",
        body: "A concept map from basics to deep dive, with primary sources like specs and source code. Tick off what you've mastered.",
        link: "How to learn",
        to: "/how-to-learn",
      },
      {
        icon: "code",
        title: "Practice right away",
        body: "Write HTML, CSS, and JavaScript in the Learning Room and see the result instantly. Notes and progress are saved to your account.",
        link: "Open the Learning Room",
        to: "room",
      },
      {
        icon: "video",
        title: "Explain it in your own words",
        body: "Record a short explanation video as evidence of learning, then share it with the community. If you can explain it, you understand it.",
        link: "See the community",
        to: "community",
      },
    ],
    roadmapEyebrow: "Roadmap",
    roadmapTitle: "From how the internet works to desktop apps",
    roadmapLead: "Each stage builds on the previous one. Start at phase 1, or jump to the topic you need.",
    roadmapAll: "See the full roadmap",
    toolkitEyebrow: "Toolkit",
    toolkitTitle: "Small packages that grow out of the material",
    toolkitLead: "No runtime dependencies, tested, and the source is deliberately short so you can read it as study material.",
    toolkitAll: "See the toolkit",
    packages: [
      ["@chalidade/utils", "debounce, throttle, cx, clamp"],
      ["@chalidade/tokens", "Design tokens and CSS variables, with dark mode"],
      ["@chalidade/react-hooks", "SSR-safe hooks"],
    ],
    ctaTitle: "Start with stage 01 today.",
    ctaBody: "Sign in with GitHub or Google to save your progress, notes, and code.",
    ctaCommunity: "See the community",
    mock: {
      stage: "Stage 04 · JavaScript",
      status: "In progress",
      concepts: ["Scope, hoisting, TDZ", "Closures & garbage collection", "Event loop: tasks vs microtasks"],
      progress: "2 of 19 concepts",
    },
  },
} as const;

const c = computed(() => copy[lang.value]);
const prefix = computed(() => (lang.value === "en" ? "/en" : ""));

function to(target: string): string {
  const p = paths(lang.value);
  if (target === "room") return href(p.room());
  if (target === "community") return href(p.community());
  return href(prefix.value + target);
}

const phaseList = computed(() =>
  phases.map((phase) => {
    const [label, name] = phase[lang.value].split(" · ");
    return { label, name, stages: stages.slice(...phase.range) };
  }),
);
</script>

<template>
  <div class="fet-home">
    <!-- Hero -->
    <section class="fet-home__hero">
      <div class="fet-home__container fet-home__hero-grid">
        <div class="fet-home__intro">
          <p class="fet-home__eyebrow">{{ c.eyebrow }}</p>
          <h1>{{ c.title }}</h1>
          <p class="fet-home__lead">{{ c.lead }}</p>
          <div class="fet-home__actions">
            <a class="fet-btn fet-btn--lg" :href="to('room')">{{ c.start }} <Icon name="arrow-right" /></a>
            <a class="fet-btn fet-btn--lg fet-btn--ghost" :href="to('/roadmap/')">{{ c.roadmap }}</a>
          </div>
          <a class="fet-link fet-home__what" :href="to('/guide/')">{{ c.what }} <Icon name="arrow-right" :size="14" /></a>
        </div>

        <!-- Cuplikan produk: tampilan Ruang Belajar yang disederhanakan -->
        <div class="fet-home__mock" aria-hidden="true">
          <div class="fet-mock">
            <div class="fet-mock__head">
              <span class="fet-mock__stage">{{ c.mock.stage }}</span>
              <span class="fet-badge" data-status="in-progress">{{ c.mock.status }}</span>
            </div>
            <ul class="fet-mock__concepts">
              <li v-for="(concept, i) in c.mock.concepts" :key="concept" :class="{ done: i < 2 }">
                <span class="box"><Icon v-if="i < 2" name="check" :size="12" /></span>{{ concept }}
              </li>
            </ul>
            <div class="fet-mock__progress">
              <span class="fet-progress-bar"><span style="width: 11%" /></span>
              <span>{{ c.mock.progress }}</span>
            </div>
            <pre class="fet-mock__code"><code><span class="k">console</span>.log(<span class="s">"sync"</span>);
<span class="k">setTimeout</span>(() =&gt; log(<span class="s">"task"</span>));
<span class="k">queueMicrotask</span>(() =&gt; log(<span class="s">"microtask"</span>));
<span class="c">// sync → microtask → task</span></code></pre>
          </div>
        </div>
      </div>

      <div class="fet-home__container">
        <dl class="fet-home__stats">
          <div v-for="[value, label] in c.stats" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- Cara belajar -->
    <section class="fet-home__section">
      <div class="fet-home__container">
        <header class="fet-home__heading">
          <p class="fet-home__eyebrow">{{ c.howEyebrow }}</p>
          <h2>{{ c.howTitle }}</h2>
        </header>
        <ol class="fet-home__steps">
          <li v-for="(step, i) in c.steps" :key="step.title">
            <div class="fet-home__step-top">
              <span class="fet-home__step-icon"><Icon :name="step.icon as IconName" :size="18" /></span>
              <span class="fet-home__step-num">0{{ i + 1 }}</span>
            </div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.body }}</p>
            <a class="fet-link fet-small" :href="to(step.to)">{{ step.link }} <Icon name="arrow-right" :size="14" /></a>
          </li>
        </ol>
      </div>
    </section>

    <!-- Roadmap -->
    <section class="fet-home__section fet-home__section--alt">
      <div class="fet-home__container">
        <header class="fet-home__heading fet-home__heading--row">
          <div>
            <p class="fet-home__eyebrow">{{ c.roadmapEyebrow }}</p>
            <h2>{{ c.roadmapTitle }}</h2>
            <p class="fet-home__sub">{{ c.roadmapLead }}</p>
          </div>
          <a class="fet-btn fet-btn--ghost" :href="to('/roadmap/')">{{ c.roadmapAll }} <Icon name="arrow-right" /></a>
        </header>
        <div class="fet-home__phases">
          <div v-for="phase in phaseList" :key="phase.label" class="fet-home__phase">
            <span class="fet-home__phase-label">{{ phase.label }}</span>
            <h3>{{ phase.name }}</h3>
            <ul>
              <li v-for="st in phase.stages" :key="st.slug">
                <a :href="href(paths(lang).stage(st.slug))"><span>{{ st.slug.slice(0, 2) }}</span>{{ st.title }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Toolkit -->
    <section class="fet-home__section">
      <div class="fet-home__container fet-home__split">
        <div>
          <p class="fet-home__eyebrow">{{ c.toolkitEyebrow }}</p>
          <h2>{{ c.toolkitTitle }}</h2>
          <p class="fet-home__sub">{{ c.toolkitLead }}</p>
          <ul class="fet-home__packages">
            <li v-for="[name, desc] in c.packages" :key="name">
              <code>{{ name }}</code>
              <span>{{ desc }}</span>
            </li>
          </ul>
          <a class="fet-link" :href="to('/toolkit/')">{{ c.toolkitAll }} <Icon name="arrow-right" :size="14" /></a>
        </div>
        <pre class="fet-home__terminal"><code><span class="c">$</span> pnpm add @chalidade/react-hooks

<span class="k">import</span> { useDebouncedValue } <span class="k">from</span> <span class="s">"@chalidade/react-hooks"</span>;

<span class="k">const</span> query = useDebouncedValue(input, <span class="n">300</span>);</code></pre>
      </div>
    </section>

    <!-- CTA -->
    <section class="fet-home__section fet-home__section--tight">
      <div class="fet-home__container">
        <div class="fet-home__cta">
          <div>
            <h2>{{ c.ctaTitle }}</h2>
            <p>{{ c.ctaBody }}</p>
          </div>
          <div class="fet-home__cta-actions">
            <a class="fet-btn fet-btn--lg fet-btn--light" :href="to('room')">{{ c.start }} <Icon name="arrow-right" /></a>
            <a class="fet-link fet-home__cta-link" :href="to('community')">{{ c.ctaCommunity }}</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
