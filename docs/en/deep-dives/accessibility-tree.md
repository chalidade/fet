# Deep Dive: The Accessibility Tree & How Screen Readers Work

> Related: [02 HTML](../roadmap/02-html.md), [07 Framework](../roadmap/07-framework.md),
> [15 Web Components](../roadmap/15-web-components.md)

## Opening questions

A screen reader doesn't "see" the screen. So how does it know that something is a button, what
it's called, and whether it's pressed? Why does a `<div onclick>` look and work like a button for
mouse users but simply not exist for screen reader users? And why does adding ARIA sometimes make a
site *less* accessible?

## Mental model

The browser builds several trees from your page. The best known are the **DOM** and the **render
tree**. There's one more that developers rarely look at: the **accessibility tree**.

```
HTML ──► DOM ──► render tree ──► pixels on screen       (for eyes)
           │
           └──► accessibility tree ──► OS accessibility API ──► screen readers,
                                       (UIA, AX API, AT-SPI…)    voice control,
                                                                 switch devices
```

Every node in the accessibility tree has four things that matter:

| Property | Example | Comes from |
| --- | --- | --- |
| **Role** | `button`, `link`, `heading`, `textbox` | The HTML element (implicit role) or the `role` attribute |
| **Name** | "Save", "Email" | Text content, `<label>`, `alt`, `aria-label`, `aria-labelledby` |
| **States/properties** | `pressed`, `expanded`, `checked`, `level=1` | Native attributes (`disabled`, `checked`) or `aria-*` |
| **Value / description** | a textbox's contents, `aria-describedby` | Form elements, description attributes |

Screen readers only know this tree. They don't read CSS, don't run your event listeners, and don't
know that the blue `div` "looks like a button". If information isn't in the accessibility tree,
it doesn't exist for a screen reader user.

## Detailed mechanism

### 1. From the DOM to the accessibility tree

The browser maps each element to its role following the **HTML-AAM** spec (HTML Accessibility API
Mappings). Here is real Chromium output for this HTML:

```html
<h1>Shop</h1>
<button>Save</button>
<div class="btn" onclick="save()">Save</div>
<img src="x.png">
<img src="y.png" alt="">
<label>Email <input type="email"></label>
<button aria-label="Close"><svg aria-hidden="true"></svg>×</button>
<div role="button" tabindex="0" aria-pressed="true">Bold</div>
```

```
- heading "Shop" [level=1]
- button "Save"
- text: Save                  ← div onclick: just text, not a button
- img                         ← no alt: an image with no name
                              ← alt="": treated as decorative, removed from the tree
- textbox "Email"             ← name taken from the <label>
- button "Close"              ← aria-label overrides the "×" content
- button "Bold" [pressed]     ← role and state from ARIA
```

Many DOM nodes don't appear at all: meaningless `div`/`span` wrappers become `generic` and are
usually ignored, and elements with `display: none` or `aria-hidden="true"` are dropped from the
tree.

### 2. Accessible name computation

A node's name is computed by the **accname** algorithm, in order. The first match wins:

1. `aria-labelledby` (can point to several elements, even hidden ones)
2. `aria-label`
3. Native attributes: `<label>` for inputs, `alt` for images, `<caption>` for tables, `title` (last)
4. The element's own text content, for roles that can be named from content (button, link, heading, …)

The consequence: an `aria-label` on a button with text content **replaces** that text. If the
visible label says "Place order" but `aria-label="Submit"`, a voice control user who says "click
Place order" won't find the button.

### 3. ARIA only changes the tree, not behavior

`role="button"` changes the role in the accessibility tree. That's all. The browser does **not**
add:

- keyboard focus (you need `tabindex="0"`),
- activation with Enter and Space (you need your own `keydown` handler),
- a `disabled` state that actually prevents clicks.

`<button>` gets all of that for free. This is the **first rule of ARIA**: if there's a native HTML
element with the semantics and behavior you need, use it.

Wrong ARIA is worse than no ARIA: `role="button"` on a navigation link makes screen readers announce
"button", so users expect an action on this page, not navigation to another one.

### 4. How screen readers read it

Screen readers (NVDA, JAWS, VoiceOver, TalkBack, Orca) get the tree through the operating system's
accessibility API and offer two main ways to explore it:

- **Browse mode (virtual cursor):** users move element by element with the arrow keys, or jump by
  type: `H` to the next heading, `K`/`Tab` to links, `D` to landmarks (NVDA). Many users start by
  opening the **list of headings** or **landmarks** to understand the page structure, much like
  scanning a page visually.
- **Focus/forms mode:** keystrokes go to the page, for example while typing in a textbox.

That's why ordered headings (`h1` → `h2` → `h3`) and landmarks (`<main>`, `<nav>`, `<header>`,
`<footer>`) aren't decoration: they are the table of contents for screen reader users.

### 5. Dynamic changes

When content changes without a page load (a "Saved" toast, search results, validation errors),
screen readers don't read it automatically. There are two tools:

- **Live regions:** an element with `role="status"` (polite, waits for the user) or `role="alert"`
  (interrupts immediately). The region must already be in the DOM **before** its content changes,
  because what gets announced is the *change*.
- **Moving focus:** for example to the dialog's title when it opens, then back to the triggering
  button when it closes. In an SPA, a route change should move focus to the new page's heading.

## Experiments

1. **See the tree.** Open Chrome DevTools → Elements panel → **Accessibility** tab, then turn on
   *Enable full-page accessibility tree*. Compare the DOM tree and the accessibility tree for a page
   you've built.
2. **Automatic snapshot.** With Playwright:
   ```js
   await page.setContent(`<button>Save</button><div onclick="x()">Save</div>`);
   console.log(await page.locator("body").ariaSnapshot());
   ```
   Explain why only one is recorded as a `button`.
3. **Use a real screen reader for 15 minutes.** VoiceOver (macOS: Cmd+F5), NVDA (Windows, free), or
   TalkBack (Android). Close your eyes or turn off the screen, then try to find the navigation menu,
   fill in a form, and submit it. Note what was confusing.
4. **Conflicting names.** Give a "Place order" button `aria-label="Submit"`. Check the name in the
   Accessibility pane, then try Voice Control (macOS) or Voice Access (Android).
5. **Fake button.** Build a `<div role="button">` with `tabindex` and keyboard handlers until it
   behaves exactly like `<button>` (focus, Enter, Space, disabled). Count the lines of code.
6. **Live region.** Make a "Save" button that shows "Saved" after 1 second. Test with a screen
   reader without a live region, then with a `role="status"` that exists from the start, then with a
   `role="status"` added at the same time as its text.

Record your results and surprises in your [experiment notes](/en/notes/). Experiment 3 is usually
the one that changes how people write HTML the most.

## Practical implications

- **Semantic HTML first**, ARIA later. `<button>`, `<a href>`, `<label>`, `<nav>`, `<main>`, and
  `<dialog>` already carry role, name, state, and keyboard behavior.
- Every interactive control needs a **computable name**. Icon buttons need an `aria-label` or
  visually hidden text. Images need meaningful `alt`, or `alt=""` when decorative.
- The announced name should **contain the visible label text**, so voice control users can say it.
- Keep the heading and landmark structure intact. One `h1` per page, and don't skip levels without
  a reason.
- For complex widgets (combobox, tabs, menus), follow the **ARIA Authoring Practices Guide**
  patterns, including their keyboard interaction, not just their attributes.
- Dynamic content needs live regions or focus management.
- Test with the accessibility tree (DevTools, `ariaSnapshot`) in CI and with a real screen reader
  regularly. Automated linters only catch a small share of problems.

## Primary sources

- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [HTML Accessibility API Mappings (HTML-AAM)](https://www.w3.org/TR/html-aam-1.0/)
- [Accessible Name and Description Computation (accname)](https://www.w3.org/TR/accname-1.2/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/), especially
  [Read Me First](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Chrome DevTools: Accessibility features reference](https://developer.chrome.com/docs/devtools/accessibility/reference)
- [Playwright: Aria snapshots](https://playwright.dev/docs/aria-snapshots)
