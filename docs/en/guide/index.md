# What is fet?

**fet (Front-End Training)** is a place to learn front-end **all the way down**. It has three parts:

1. **Roadmap**: front-end topics in order, from fundamentals to advanced, in [20 stages and 8 phases](/en/roadmap/).
2. **A learning guide for every stage**: not just *what* to learn, but *how* to learn it and
   *how to know you've understood it*.
3. **Toolkit**: small npm packages you can use in your projects right away. They also serve as
   code to study.

## Who is it for?

| You are… | Start with |
| --- | --- |
| **New to front-end** | [How to learn](/en/how-to-learn), then go through [Phase 1](/en/roadmap/01-internet) in order |
| **An experienced developer** who feels you don't truly understand how things work | The **Check your understanding** section of each stage. Any question you can't answer confidently is where to dive deep |
| **Looking for ready-to-use utils or components** | [Toolkit](/en/toolkit/) |
| **A mentor or tech lead** | Use the roadmap and the questions as an onboarding curriculum for your team |

## How is it different from other roadmaps?

Popular roadmaps like [roadmap.sh](https://roadmap.sh/frontend) tell you **what** to learn. fet uses
that as a starting point and adds:

- **Tiered concept maps** (Basics → Intermediate → Deep dive), so it's clear when a topic is
  "enough" and when it needs more digging.
- **Concrete learning steps**, usually with DevTools or small experiments, not just a list of links.
- **Check your understanding**: questions that test your grasp of mechanisms, not API memorization.
- **"Build it from scratch" projects**: rebuild the tools you use every day (mini React, mini
  bundler, Promise) until you understand their insides.
- **Primary sources**: specifications (WHATWG, ECMA-262, CSSWG), official docs, and source code.

## Structure of every stage

All roadmap pages use the same format, so you always know where to look:

| Section | Contents |
| --- | --- |
| **Why it matters** | The problem it solves and what happens if you don't understand it |
| **Concept map** | Checklist of Basics / Intermediate / Deep dive |
| **How to learn** | Ordered steps with small exercises |
| **Check your understanding** | Questions that measure how deeply you understand |
| **Practice projects** | Basic, Intermediate, and Deep (build from scratch) projects |
| **Primary sources** | Specs, official docs, books, source code |
| **Related toolkit** | Packages in this repo related to the topic |

## How to use this site

1. Read [How to learn](/en/how-to-learn) (5 minutes). It explains the 4 levels of understanding used throughout the site.
2. **Sign in** (top-right button) with GitHub or Google so your progress is saved.
3. Open the [Roadmap overview](/en/roadmap/), pick the stage that fits you, and click **Start learning**.
4. In the **Learning Room**, for each stage:

| Step | Where | Result |
| --- | --- | --- |
| 1. Read the material and answer *Check your understanding* | The stage page | You know which parts you don't understand yet |
| 2. Do the exercises and experiments | **Code** tab (editor + live preview) | Exercise code saved to your account |
| 3. Write notes | **Notes** tab | Notes: question → experiment → conclusion |
| 4. Record a 3–5 minute video explanation | **Video explanation** tab | A video in your Google Drive, evidence you can replay |
| 5. Share with the community | **Share** tab | A post in the [Community](/en/community/) others can comment on |
| 6. Mark it **Done** | The *Status* picker | Progress shown on [your profile](/en/profile) |

::: tip Why record a video?
Explaining something in your own words is the most honest test of understanding (the Feynman
technique). If you get stuck explaining, there's a part you need to learn again. The video also
becomes a personal archive: when you forget, just replay your own explanation.
:::

## Your data is yours

- **Videos** and exported notes are stored in **your own Google Drive** (the `fet-belajar/` folder).
  fet can only access files it created.
- **Progress, notes, and code** are stored in your account. Notes and code are private unless you
  share them in a post.
- You can download everything as a `.zip` from the Learning Room at any time.

## Repository contents

```
fet/
├── docs/              # this site (VitePress), Bahasa Indonesia + English (docs/en)
│   ├── roadmap/       # 20 stages in 8 phases
│   ├── deep-dives/    # topics deeper than the roadmap
│   ├── toolkit/       # package documentation
│   └── notes/         # personal experiment notes
└── packages/          # toolkits installable from npm
    └── utils/         # @chalidade/utils
```

## Contributing

Found a mistake or want to add material? Click **"Edit this page on GitHub"** at the bottom of any
page, or open an issue at [github.com/chalidade/fet](https://github.com/chalidade/fet).
