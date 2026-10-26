# 05 · Git & Version Control

> **Fase:** 2 · **Estimasi:** 1 minggu · **Prasyarat:** tidak ada

## Kenapa ini penting

Hampir semua developer bisa `commit` dan `push`, tapi panik saat terjadi rebase conflict, detached
HEAD, atau commit yang hilang. Begitu object model Git dipahami, tidak ada lagi perintah yang
terasa menakutkan.

## Peta konsep

### Dasar
- [ ] `init`, `add`, `commit`, `status`, `log`, `diff`
- [ ] Branch, merge, conflict resolution
- [ ] Remote: `clone`, `fetch`, `pull`, `push`
- [ ] VCS hosting: GitHub, GitLab, Bitbucket; pull request / merge request

### Menengah
- [ ] `rebase` vs `merge`, interactive rebase, `--fixup` + `--autosquash`
- [ ] `reset` (soft/mixed/hard) vs `revert` vs `restore`
- [ ] `reflog` untuk menyelamatkan commit yang "hilang"
- [ ] `stash`, `cherry-pick`, `bisect`
- [ ] Konvensi: Conventional Commits, trunk-based vs Git Flow

### Deep dive
- [ ] Object model: blob, tree, commit, tag; content-addressable storage
- [ ] Ref, HEAD, index (staging area) sebagai file
- [ ] Packfile dan delta compression
- [ ] Merge strategy (`ort`) dan three-way merge

## Cara belajar

1. Buat repo kosong, lalu jalankan `find .git -type f` setelah setiap perintah untuk melihat apa yang berubah.
2. Gunakan `git cat-file -p <hash>` untuk menelusuri commit → tree → blob secara manual.
3. Latihan `bisect` pada repo yang sengaja diberi bug di commit ke-37 dari 50.
4. Selamatkan commit setelah `reset --hard` dengan `reflog`.

## Uji pemahaman

1. Apa yang sebenarnya disimpan sebuah commit? Kenapa mengubah satu file mengubah hash semua commit sesudahnya saat rebase?
2. Kenapa "jangan rebase branch yang sudah di-push bersama" adalah aturan yang masuk akal?
3. Apa beda `git reset --soft HEAD~1` dengan `git revert HEAD`?
4. Bagaimana Git tahu sebuah file di-rename padahal yang disimpan hanya snapshot?

## Proyek latihan

| Tingkat | Proyek | Yang dilatih |
| --- | --- | --- |
| Dasar | Kontribusi PR ke repo open source (dokumentasi pun boleh) | Workflow PR |
| Menengah | Setup repo dengan Conventional Commits + commitlint + changelog otomatis | Konvensi, tooling |
| Deep | Tulis mini Git: `init`, `hash-object`, `cat-file`, `write-tree`, `commit-tree` | Object model |

## Sumber primer

- [Pro Git book, bab 10: Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Write yourself a Git](https://wyag.thb.lt/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Toolkit terkait

- Repo ini sendiri memakai changesets untuk versioning package
