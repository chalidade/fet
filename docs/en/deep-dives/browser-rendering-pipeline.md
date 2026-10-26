# Deep Dive: The Browser Rendering Pipeline

> Related: [03 CSS](../roadmap/03-css.md), [16 Performance](../roadmap/16-performance.md)

## Opening question

Why does changing `transform` run smoothly at 60 fps while changing `width` stutters? What actually
happens between "the DOM changed" and "the pixels on screen changed"?

## Mental model

```
HTML ──parse──▶ DOM ─┐
                     ├─▶ Style (computed styles) ─▶ Layout (geometry) ─▶ Paint (display list)
CSS  ──parse──▶ CSSOM┘                                                        │
                                                                              ▼
                                      Composite (layers → GPU, on the compositor thread) ─▶ Screen
```

Changing a property triggers the pipeline **from a particular stage onward**:

| What changes | Example properties | Stages that re-run |
| --- | --- | --- |
| Geometry | `width`, `top`, `font-size`, adding elements | Style → Layout → Paint → Composite |
| Appearance only | `color`, `background`, `box-shadow` | Style → Paint → Composite |
| Compositor only | `transform`, `opacity` (on their own layer) | Composite |

Because compositing runs on the **compositor thread**, `transform`/`opacity` animations stay smooth
even while the main thread is busy running JavaScript.

## Detailed mechanism

- **Parsing:** HTML is parsed incrementally. A plain `<script>` stops the parser, while the
  *preload scanner* keeps looking for other resources to download early.
- **Style:** the browser matches selectors to elements (right to left), then computes values.
  Complex selectors plus a large DOM = expensive style recalculation.
- **Layout:** computes position and size based on the formatting context (block, inline, flex, grid).
  Layout can be local or global depending on the boundaries of the change (`contain: layout` helps).
- **Paint:** produces a list of drawing commands per layer, which is then rasterized (often on the GPU).
- **Layers:** elements are promoted to their own layer because of `will-change`, 3D `transform`,
  video, canvas, etc. Too many layers = bloated GPU memory.
- **Forced synchronous layout:** reading geometry (`offsetWidth`, `getBoundingClientRect`) after
  writing styles forces the browser to run layout **right then**. Do it in a loop and you get
  *layout thrashing*.

## Experiments

1. **Cost per property.** Animate a box with `left`, then with `transform: translateX`. Record in the
   Performance panel and turn on *Paint flashing* and *Layer borders* in the Rendering tab.
2. **Layout thrashing.**
   ```js
   const items = [...document.querySelectorAll(".item")];
   // Bad: interleaved reads and writes → layout on every iteration
   items.forEach(el => { el.style.width = el.offsetWidth + 10 + "px"; });
   // Good: read everything first, then write everything
   const widths = items.map(el => el.offsetWidth);
   items.forEach((el, i) => { el.style.width = widths[i] + 10 + "px"; });
   ```
   Compare the timing with 1,000 elements.
3. **Busy main thread vs the compositor.** Run a heavy 2-second loop while a `transform` animation and
   a `left` animation are running. Which one keeps moving?
4. **`content-visibility: auto`.** Apply it to a long page and measure the initial render time.

## Practical implications

- Animate only `transform` and `opacity` whenever possible.
- Batch layout reads and style writes separately (or use rAF for the writes).
- Use `will-change` sparingly, not on every element.
- Use `contain` and `content-visibility` to limit the scope of layout/paint work.

## Primary sources

- [Chrome: Inside look at modern web browser (parts 1–4)](https://developer.chrome.com/blog/inside-browser-part1)
- [Chromium: RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
- [What forces layout / reflow (Paul Irish)](https://gist.github.com/paulirish/5d52fb081b3570c81e3a)
- [CSS Containment](https://www.w3.org/TR/css-contain-2/)
