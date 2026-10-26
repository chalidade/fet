# 05 · Git & Version Control

> **Phase:** 2 · **Estimate:** 1 week · **Prerequisites:** none

## Why it matters

Almost every developer can `commit` and `push`, but panics at a rebase conflict, a detached HEAD, or a
"lost" commit. Once you understand Git's object model, no command feels scary anymore.

## Concept map

### Basics
- [ ] `init`, `add`, `commit`, `status`, `log`, `diff`
- [ ] Branches, merging, conflict resolution
- [ ] Remotes: `clone`, `fetch`, `pull`, `push`
- [ ] VCS hosting: GitHub, GitLab, Bitbucket; pull requests / merge requests

### Intermediate
- [ ] `rebase` vs `merge`, interactive rebase, `--fixup` + `--autosquash`
- [ ] `reset` (soft/mixed/hard) vs `revert` vs `restore`
- [ ] `reflog` to rescue "lost" commits
- [ ] `stash`, `cherry-pick`, `bisect`
- [ ] Conventions: Conventional Commits, trunk-based vs Git Flow

### Deep dive
- [ ] The object model: blob, tree, commit, tag; content-addressable storage
- [ ] Refs, HEAD, and the index (staging area) as files
- [ ] Packfiles and delta compression
- [ ] Merge strategies (`ort`) and three-way merges

## How to learn

1. Create an empty repo, then run `find .git -type f` after each command to see what changed.
2. Use `git cat-file -p <hash>` to walk commit → tree → blob by hand.
3. Practice `bisect` on a repo with a bug planted in commit 37 of 50.
4. Rescue a commit after `reset --hard` using `reflog`.

## Check your understanding

1. What does a commit actually store? Why does changing one file change the hash of every later commit during a rebase?
2. Why is "don't rebase a shared branch that's already been pushed" a sensible rule?
3. What's the difference between `git reset --soft HEAD~1` and `git revert HEAD`?
4. How does Git know a file was renamed when it only stores snapshots?

## Practice projects

| Level | Project | What it trains |
| --- | --- | --- |
| Basic | Contribute a PR to an open source repo (docs count) | PR workflow |
| Intermediate | Set up a repo with Conventional Commits + commitlint + an automatic changelog | Conventions, tooling |
| Deep | Write a mini Git: `init`, `hash-object`, `cat-file`, `write-tree`, `commit-tree` | Object model |

## Primary sources

- [Pro Git book, chapter 10: Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Write yourself a Git](https://wyag.thb.lt/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Related toolkit

- This repo itself uses changesets to version its packages
