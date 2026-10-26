# 20 · Mobile & Desktop Apps

> **Phase:** 8 · **Estimate:** 2 weeks (exploration) · **Prerequisites:** [07 Framework](07-framework.md)

## Why it matters

Front-end skills work outside the browser too. Each approach trades off performance, app size, access
to native APIs, and how much code can be reused.

## Concept map

### Mobile
- [ ] React Native (Expo): the bridge vs the New Architecture (JSI, Fabric)
- [ ] Flutter: Dart, its own rendering (Impeller)
- [ ] Ionic / Capacitor: the web inside a WebView
- [ ] PWAs as an alternative

### Desktop
- [ ] Electron: Chromium + Node, main vs renderer processes, IPC
- [ ] Tauri: the system WebView + Rust, small size
- [ ] Flutter desktop

### Deep dive
- [ ] Electron security: `contextIsolation`, `sandbox`, preload scripts
- [ ] How React Native maps components to native views
- [ ] Code sharing between web and mobile (monorepos, React Native Web)

## How to learn

1. Build the same todo app with Expo, Capacitor, and Tauri. Compare build size, startup time, and how they feel.
2. Read Electron's security docs and audit an open source Electron app.

## Check your understanding

1. Why are Electron apps large and memory-hungry, and how does Tauri avoid that?
2. What does React Native's New Architecture solve compared with the old bridge?
3. When is a PWA enough, and when do you need a native app?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | An Expo app that uses the camera and notifications | React Native |
| Intermediate | A Tauri desktop app that reads local files | Tauri, IPC |
| Deep | A monorepo that shares logic and design tokens between web and React Native | Code sharing |

## Primary sources

- [React Native: Architecture](https://reactnative.dev/architecture/overview)
- [Electron: Security](https://www.electronjs.org/docs/latest/tutorial/security)
- [Tauri docs](https://tauri.app/)

## Related toolkit

- (planned) `@chalidade/tokens` is designed to work on both web and React Native
