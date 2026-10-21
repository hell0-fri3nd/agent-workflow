---
name: commit
description: Use when committing changes, writing a commit message, or turning a working tree into commits in any repository, including requests like "commit this", "commit my changes", or "save my work".
---

# Commit

## Overview

You are a senior engineer turning a working tree into history someone else will read, revert, and release from. A commit is a claim: "this is one change, and this is what it does." The `system-version` skill reads these messages to decide the next version, so the type you choose is a promise about impact, not a label.

One logical change per commit. A message that says why. Nothing in the commit the developer would not want shipped.

## When to Use

- The developer asks you to commit, or work you were asked to finish is ready to commit
- You need to write or fix a commit message
- The working tree holds several unrelated changes that must be split

Not for: bumping the version (use `system-version`), pushing, tagging, or opening pull requests.

## Step 1 — Read the Working Tree

```bash
git status --porcelain -uall
git diff                      # unstaged
git diff --cached             # already staged — respect what the developer staged
git log --oneline -15         # the message style this repository already uses
```

Read every diff. You cannot type or split a change you have not read.

## Step 2 — Hold Back What Must Not Ship

Check every changed and untracked file before staging anything:

| Found | Action |
|-------|--------|
| Secrets — `.env*`, keys, tokens, credentials, connection strings | Never commit. Never print the value. Report it, and recommend the `.gitignore` entry |
| Debug output added in this diff — `console.log`, `print`, `debugger`, `dd()`, temporary logging | **Stop and ask:** remove it, or commit as is? Do not commit it silently |
| Build output, `node_modules`, `__pycache__`, `.venv`, local editor or OS files | Leave unstaged and report it |
| A file you cannot explain from the diff | Leave unstaged and ask |

Debug output is the mistake this step exists for. "The developer is in a hurry" and "it's their code" are not reasons to commit it unasked — one question costs seconds; a debug log in production costs a cleanup commit and a noisy console for every user.

## Step 3 — Split Into Logical Changes

One commit = one change that could be reverted on its own.

- A bug fix and an unrelated feature are two commits, even in the same session
- Documentation for a feature goes **with** that feature; a standalone docs correction is its own `docs` commit
- Tests go with the code they test
- Order commits so every one builds: dependencies first, then what uses them
- A version bump is never part of these commits — it belongs to `system-version`, last

Stage by explicit path: `git add <path> <path>`. Never `git add -A`, `git add .`, or `git commit -a` — they sweep in exactly the files Step 2 held back.

If one file holds two unrelated changes and you cannot split it without interactive staging, commit it once, typed by the higher impact, and name both changes in the body.

## Step 4 — Write the Message

```text
<type>(<scope>)<!>: <subject>

<body>

<footer>
```

**Type** — choose by impact on whoever consumes the system, because `system-version` will:

| Type | Use for | Version impact |
|------|---------|----------------|
| `feat` | New capability, route, component, endpoint, option | MINOR |
| `refactor` | Restructure with identical behavior | MINOR |
| `fix` | Existing behavior made correct | PATCH |
| `perf` | Faster, same behavior | PATCH |
| `docs` `test` `style` `ci` `build` `chore` | Never reaches the deployed system | none |
| `revert` | Undo an earlier commit | that commit's impact |

**`!` and `BREAKING CHANGE:`** — only when the developer has said the change is breaking. If you believe it breaks a consumer and they have not said so, stop and ask. Never add `!` on your own judgment, never leave it off a change the developer called breaking.

**Scope** — the area touched (`auth`, `requests`, `api`), matching scopes already in `git log`. Omit it rather than invent one.

**Subject** — imperative, lowercase, no trailing period, 72 characters max. Say what the change does, not which file changed: `fix(auth): treat JWT exp as seconds`, not `fix: update auth.ts`.

**Body** — required for `feat`, `fix`, `perf`, `refactor`, and anything breaking. Optional for the no-impact types. Wrap at 72. Answer two questions:

1. What was wrong or missing?
2. What does this change do about it?

**Footer** — `BREAKING CHANGE: <what breaks> — <what the consumer must do>`, issue references (`Refs: #123`), and any co-author trailer this tool or repository requires.

Pass multi-line messages with `git commit -F -` and a heredoc, or `-F <file>`, so line breaks survive.

## Step 5 — Commit and Verify

```bash
git commit -F - <<'EOF'
...
EOF
git log --stat -<n>        # each commit holds what you meant
git status --short         # only held-back files remain
```

If a pre-commit hook fails, fix the cause and create the commit again. Never `--no-verify`. Never `--amend` a commit that already existed before this task, never rewrite history, never push, never tag.

## Step 6 — Report

```
## Commits

e373522 fix(auth): treat JWT exp as seconds in isExpired
        src/lib/auth.ts
4b2823b feat(requests): add review round filter
        src/app/requests/RoundFilter.tsx, src/app/requests/page.tsx, README.md

Held back: .env.local — contains DATABASE_URL; add `.env*.local` to .gitignore
Asked: console.log in RoundFilter.tsx — removed at developer's request
```

If you stopped to ask, report the question — not a guessed commit.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Debug log committed because the developer was in a hurry | Step 2: ask first, every time |
| `git add -A` after deciding to hold a file back | Stage by explicit path only |
| Subject-only message on a `fix` | The body says what was broken |
| `refactor` used for a behavior change | Behavior changed → `feat` or `fix` |
| `chore` used to hide a user-visible change | Type by impact; `chore` never reaches users |
| `!` added because a change "looks breaking" | Ask; only the developer declares MAJOR |
| Version bump mixed into a feature commit | Bumps are `system-version`'s own last commit |
