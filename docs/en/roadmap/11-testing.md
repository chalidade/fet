# 11 · Testing

> **Phase:** 4 · **Estimate:** 2–3 weeks · **Prerequisites:** [07 Framework](07-framework.md)

## Why it matters

Good tests give you the confidence to refactor. Bad tests (brittle, slow, testing implementation)
hold you back. The core skill isn't the syntax of a test framework. It's deciding **what to test and
at which level**.

## Concept map

### Basics
- [ ] Unit tests: Vitest / Jest
- [ ] Component tests: Testing Library (query by role and label)
- [ ] E2E: Playwright / Cypress
- [ ] Assertions, mocks, spies

### Intermediate
- [ ] The testing pyramid vs the testing trophy
- [ ] Test doubles: stubs, mocks, fakes; network mocking with MSW
- [ ] Fake timers, testing async code
- [ ] Visual regression (Playwright screenshots, Chromatic)
- [ ] Coverage: its value and its traps

### Deep dive
- [ ] Flaky tests: their sources (timing, shared state, animation) and how to eliminate them
- [ ] Contract testing between front-end and API
- [ ] Mutation testing (Stryker) to measure test quality
- [ ] Automated accessibility testing (axe-core)

## How to learn

1. Write tests for `@chalidade/utils`, then change the implementation. Which tests fail because behavior changed, and which only because of implementation details?
2. Replace every `getByTestId` query in a project with `getByRole`, and note the a11y bugs you find.
3. Write one Playwright E2E test, run it 50 times (`--repeat-each=50`), and fix it until it's not flaky.

## Check your understanding

1. Why does Testing Library encourage `getByRole` queries?
2. When do mocks make a test useless?
3. What does 100% coverage not guarantee?
4. How does Playwright handle auto-waiting, and why is a `sleep` in a test a warning sign?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | Unit tests for a util + a component test for a form | Vitest, Testing Library |
| Intermediate | An E2E suite for a login–checkout flow with MSW and Playwright | E2E, mocking |
| Deep | A mini test runner: `describe`/`it`/`expect`, hooks, a reporter | How runners work |

## Primary sources

- [Testing Library: Guiding principles](https://testing-library.com/docs/guiding-principles)
- [Playwright: Best practices](https://playwright.dev/docs/best-practices)
- [Kent C. Dodds: The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## Related toolkit

- [`packages/utils/src/index.test.ts`](https://github.com/chalidade/fet/blob/main/packages/utils/src/index.test.ts): an example of tests with fake timers
