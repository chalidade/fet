# How to Learn

For experienced programmers, the problem usually isn't "not knowing". It's **knowing how to use
something without knowing how it works**. The method below is designed to close that gap.

## 1. Four levels of understanding

Every concept in the roadmap can be rated on this scale. Aim for level 3 on core topics and level 4
on the topics you want to truly master.

| Level | What it looks like | How to prove it |
| --- | --- | --- |
| 1. Use | You can use the API/tool by following the docs | Ship a working feature |
| 2. Explain | You can explain *why* it's designed that way and its trade-offs | Write an explanation without opening references |
| 3. Debug | You can predict behavior in edge cases and fix weird bugs | Answer *Check your understanding* and prove it with experiments |
| 4. Build | You can rebuild a small version from scratch | The "build it from scratch" project in each stage |

## 2. The learning cycle for each topic

1. **Read the concept map** on the stage page. Tick what you've mastered to level 2.
2. **Answer Check your understanding first, before studying.** Write your answers in `docs/notes/`.
   Wherever you hesitate marks what you need to learn.
3. **Learn from primary sources.** Specifications (WHATWG, ECMA-262, CSSWG), MDN, and the tool's
   source code. Use articles and videos only as an introduction.
4. **Prove it with experiments.** Test every important claim with small code, DevTools, or
   measurements. Keep the experiments.
5. **Build it from scratch.** Do the "deep" practice project on the stage page.
6. **Teach it.** Record a 3–5 minute video explanation in the [Learning Room](/en/learning-room), share it
   with the [Community](/en/community/), or turn it into a toolkit in `packages/`.

## 3. Why personal notes matter

AI and articles can explain the *average* of what people have already written. What neither has is
**the results of your own experiments and measurements**: how many ms of layout thrashing your work
app has, the browser bug you found, an architecture decision and what it led to six months later.
That's what takes your understanding beyond the average. Keep them in `docs/notes/` in this format:

```
docs/notes/YYYY-MM-DD-short-title.md
- Question: ...
- Hypothesis: ...
- Experiment: (code / steps / link)
- Result: (numbers, screenshots)
- Conclusion & surprises: ...
```

## 4. Suggested rhythm

- **Daily (30–60 minutes):** one concept from the map, one small experiment.
- **Weekly:** answer one *Check your understanding* question thoroughly, write one note in `docs/notes/`.
- **Per stage (2–6 weeks):** finish one practice project, add one util/component to `packages/`.

## 5. Ground rules

- Don't skip Phase 1 even if you've worked for years. Read it quickly, but answer its *Check your understanding* questions.
- Master one framework deeply, and understand enough of the others to know how they differ.
- If you can't explain it without opening a reference, you don't understand it yet.
