# 15 · Web Components

> **Phase:** 5 · **Estimate:** 1 week · **Prerequisites:** [04 JavaScript](04-javascript.md)

## Why it matters

Web Components are the browser's built-in component model and work in any framework. They're a good fit
for cross-team design systems and embedded widgets. Learning them also shows you which problems
frameworks solve.

## Concept map

### Basics
- [ ] Custom Elements: `customElements.define`, lifecycle callbacks
- [ ] Shadow DOM: encapsulation, `slot`
- [ ] HTML Templates: `<template>`

### Intermediate
- [ ] Styling: `:host`, `::slotted`, `::part`, CSS custom properties crossing the shadow boundary
- [ ] Form-associated custom elements (`ElementInternals`)
- [ ] Declarative Shadow DOM for SSR
- [ ] Lit as a lightweight library

### Deep dive
- [ ] Event retargeting and `composed`
- [ ] Accessibility across shadow roots (the `aria-labelledby` and ID problem)
- [ ] Interop with React 19

## How to learn

1. Build `<fet-counter>` without any library, then rebuild it with Lit.
2. Use that component in React, Vue, and plain HTML.
3. Build a custom input that is submitted with a native `<form>`.

## Check your understanding

1. Why do events from inside a shadow DOM appear to come from the host element?
2. What can and can't cross the shadow boundary when it comes to styling?
3. When are Web Components a better fit than framework components?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | A vanilla `<fet-tabs>` with keyboard navigation | Custom elements |
| Intermediate | A form-associated `<fet-rating>` | ElementInternals |
| Deep | A mini Lit-style library: reactive properties + template rendering | Reactivity, templating |

## Primary sources

- [HTML spec: Custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html)
- [DOM spec: Shadow tree](https://dom.spec.whatwg.org/#shadow-trees)
- [Lit docs](https://lit.dev/docs/)

## Related toolkit

- (planned) `@chalidade/elements`: Web Component versions of the `@chalidade/ui` components
