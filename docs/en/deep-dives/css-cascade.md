# Deep Dive: CSS Cascade & Specificity

> Related: [03 CSS](../roadmap/03-css.md), [08 CSS Architecture](../roadmap/08-css-architecture.md),
> [15 Web Components](../roadmap/15-web-components.md)

## Opening questions

Why does a library's `.btn` still win even though your CSS loads later? Why does `!important`
inside an `@layer` lose to `!important` in another layer? Why can Shadow DOM styles be overridden
from outside, but not their `!important` ones?

Most developers memorize "ID > class > tag". That's only **one step** of the seven steps in the
cascade.

## Mental model

For every property on every element, the browser collects all matching declarations and sorts
them by the criteria below. Each criterion is **only used when the previous ones tie**:

```
1. Origin & importance   (user-agent / user / author, normal vs !important, animations, transitions)
2. Context               (Shadow DOM: outer vs inner)
3. Element-attached      (the style="" attribute)
4. Cascade layers        (@layer)
5. Specificity           (IDs, classes, tags)
6. Scope proximity       (@scope: the nearest root wins)
7. Order of appearance   (the later one wins)
```

Only when there are no declarations at all does **inheritance** (for inherited properties like
`color`) or the **initial value** apply. An inherited value always loses to any declaration that
targets the element directly, however low its specificity.

## Detailed mechanism

### 1. Origin & importance

From weakest to strongest:

| # | Origin |
| --- | --- |
| 1 | User-agent normal (browser defaults) |
| 2 | User normal (user settings) |
| 3 | Author normal (our CSS) |
| 4 | CSS animations (`@keyframes`) |
| 5 | Author `!important` |
| 6 | User `!important` |
| 7 | User-agent `!important` |
| 8 | CSS transitions |

Note that the origin order is **reversed** for `!important`, so users (for example with an
accessibility stylesheet) always get the final say. `!important` isn't a "win button"; it
**moves a declaration into a different origin**.

### 2. Context (Shadow DOM)

For normal declarations, styles from **outside** (the light DOM, e.g. `my-el::part(x)` or host
selectors) beat styles inside the shadow root. For `!important`, it flips: **inside** wins. A
component can provide overridable defaults and still lock down what must not change.

### 3. Element-attached styles

The `style=""` attribute beats any selector at the same origin and importance. It is **not**
"specificity 1-0-0-0" as often taught; it's a separate step before layers and specificity.

### 4. Cascade layers

```css
@layer reset, base, components, utilities;
```

- Normal declarations: the layer **declared later** wins (`utilities` > `components`).
- **Unlayered** styles beat every layer for normal declarations.
- For `!important` it's **reversed**: the earliest layer wins, and `!important` in any layer beats
  unlayered `!important`.

Layers are evaluated **before** specificity. `#app .card .title` in `base` loses to `.title` in
`components`.

### 5. Specificity

Computed as three numbers **(A, B, C)** compared left to right:

| Column | Counts |
| --- | --- |
| A | ID selectors (`#id`) |
| B | Classes (`.x`), attributes (`[type=text]`), pseudo-classes (`:hover`) |
| C | Types (`div`), pseudo-elements (`::before`) |

Rules people forget:

- `*` and combinators (`>`, `+`, `~`, space) count as 0.
- `:is()`, `:not()`, `:has()` take the specificity of their **most specific argument**.
  `:is(#a, .b)` is (1,0,0) even when `.b` is what matched.
- `:where()` is always **(0,0,0)**, which makes it ideal for libraries that should be easy to override.
- `:nth-child(2n of .x)` = the pseudo-class (0,1,0) plus the specificity of the `of` argument.
- There's no "overflow": 11 classes never beat 1 ID.

### 6. Scope proximity

```css
@scope (.light) { a { color: black; } }
@scope (.dark)  { a { color: white; } }
```

For `<div class="dark"><div class="light"><a>`, the link is black because the `.light` root is
closer, even though the `.dark` rule comes later. Proximity only matters when specificity ties.

### 7. Order of appearance

When everything else ties, the later declaration wins. Order follows the stylesheet order in the
document (`<link>`, `<style>`, `@import`), not the order in which files finish downloading.

## Experiments

1. **Layers vs specificity.** Guess the color, then check DevTools (the Styles pane strikes out
   losing declarations, and the *Cascade layers* section shows the order):
   ```html
   <style>
     @layer base, components;
     @layer base { #app p.title { color: red; } }
     @layer components { .title { color: green; } }
     p { color: blue; }
   </style>
   <div id="app"><p class="title">What color?</p></div>
   ```
   Then add `!important` to the declarations in `base` and `components`. Who wins now, and why?
2. **`:where()` for libraries.** Write `.card :where(h2) { margin: 0 }` and try overriding it with
   `h2 { margin: 1rem }`. Compare with `.card h2`.
3. **Inheritance loses to any declaration.** `#hero { color: red }` then `* { color: blue }`.
   What color is the text of a `<p>` inside `#hero`?
4. **Shadow DOM.** Build a custom element with `::part(label)` and a default style inside. Override
   it from outside, then add `!important` inside. Watch what changes.

## Practical implications

- Start your stylesheet with `@layer reset, base, components, utilities;`. Specificity stops being
  a war because layer order decides.
- Put third-party CSS in its own layer: `@import url(lib.css) layer(vendor);`.
- In libraries and design systems, use `:where()` so consumers can override with any selector.
- Avoid IDs in CSS, and treat `!important` as a tool for utilities or accessibility, not for
  resolving conflicts.
- When debugging, read the cascade top-down: origin, then layer, then specificity.

## Primary sources

- [CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/) and
  [Level 6](https://www.w3.org/TR/css-cascade-6/) (`@scope`)
- [Selectors Level 4: Calculating specificity](https://www.w3.org/TR/selectors-4/#specificity-rules)
- Miriam Suzanne, [*A Complete Guide to CSS Cascade Layers*](https://css-tricks.com/css-cascade-layers/)
- [MDN: Cascade, specificity, and inheritance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts)
