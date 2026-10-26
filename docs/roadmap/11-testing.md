# 11 · Testing

> **Fase:** 4 · **Estimasi:** 2–3 minggu · **Prasyarat:** [07 Framework](07-framework.md)

## Kenapa ini penting

Test yang baik memberi keberanian untuk refactor. Test yang buruk (rapuh, lambat, menguji
implementasi) justru menghambat. Skill utamanya bukan sintaks framework test, tapi memutuskan
**apa yang perlu diuji dan di level mana**.

## Peta konsep

### Dasar
- [ ] Unit test: Vitest / Jest
- [ ] Component test: Testing Library (query berdasarkan role dan label)
- [ ] E2E: Playwright / Cypress
- [ ] Assertion, mock, spy

### Menengah
- [ ] Testing pyramid vs testing trophy
- [ ] Test doubles: stub, mock, fake; network mocking dengan MSW
- [ ] Fake timers, testing async code
- [ ] Visual regression (Playwright screenshots, Chromatic)
- [ ] Coverage: manfaat dan jebakannya

### Deep dive
- [ ] Flaky test: sumber (timing, shared state, animation) dan cara memberantasnya
- [ ] Contract testing antara front-end dan API
- [ ] Mutation testing (Stryker) untuk mengukur kualitas test
- [ ] Accessibility testing otomatis (axe-core)

## Cara belajar

1. Tulis test untuk `@chalidade/utils` lalu ubah implementasinya. Mana yang gagal karena perilaku berubah, dan mana yang hanya karena detail implementasi?
2. Ganti semua query `getByTestId` di satu project dengan `getByRole`, lalu catat bug a11y yang ditemukan.
3. Buat satu test E2E Playwright, jalankan 50 kali (`--repeat-each=50`), lalu perbaiki sampai tidak flaky.

## Uji pemahaman

1. Kenapa Testing Library mendorong query `getByRole`?
2. Kapan mock justru membuat test tidak berguna?
3. Coverage 100% tidak menjamin apa?
4. Bagaimana Playwright menangani auto-waiting, dan kenapa `sleep` di test adalah tanda bahaya?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Unit test util + component test form | Vitest, Testing Library |
| Menengah | Suite E2E untuk alur login–checkout dengan MSW dan Playwright | E2E, mocking |
| Deep | Mini test runner: `describe`/`it`/`expect`, hooks, reporter | Cara kerja runner |

## Sumber primer

- [Testing Library: Guiding principles](https://testing-library.com/docs/guiding-principles)
- [Playwright: Best practices](https://playwright.dev/docs/best-practices)
- [Kent C. Dodds: The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## Toolkit terkait

- [`packages/utils/src/index.test.ts`](https://github.com/chalidade/fet/blob/main/packages/utils/src/index.test.ts): contoh test dengan fake timers
