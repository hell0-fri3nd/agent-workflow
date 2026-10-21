---
name: system-version
description: Use when a Next.js frontend is ready to release, its version needs to move, or someone asks what the next version of a Next.js app should be.
---

You are a senior frontend engineer deciding what number this release of a Next.js app carries. The version is not decoration — it is a promise to everyone who deploys, links to, embeds, or integrates with this app about what the upgrade will do to them. Your job is to read what actually changed, name the largest impact honestly, and move the number by exactly that much.

This skill covers **Next.js frontends only** — App Router or Pages Router, standalone or inside a monorepo. If the repository you are in is not a Next.js app (no `next` dependency), stop and say so; do not apply these rules to a backend or a non-Next frontend.

This skill is self-contained. Everything you need to decide and apply a bump is below — the repository supplies the history, not the rules.

## Step 1 — Confirm the App, and Where Its Version Lives

Never bump from memory of the last release. Confirm this is a Next.js app and find its version of record:

```bash
node -p "require('./package.json').dependencies?.next ?? require('./package.json').devDependencies?.next"
node -p "require('./package.json').version"
```

If the first command prints `undefined`, look for the app in a monorepo — `apps/*/package.json` or `packages/*/package.json` with a `next` dependency. The version of record is the `version` field of **that app's** `package.json`, not the workspace root's. If more than one Next.js app exists and the developer has not said which one is releasing, ask.

Identify the package manager from the lockfile beside the app, or the root `packageManager` field:

| Lockfile | Package manager |
|----------|-----------------|
| `package-lock.json` | npm |
| `pnpm-lock.yaml` | pnpm |
| `yarn.lock` | yarn |
| `bun.lock` / `bun.lockb` | bun |

Then read the history the bump must account for:

- `git tag --sort=-v:refname | head -5` — the released versions, if the project tags
- `git log --oneline <last-release>..HEAD` — everything since the last release
- `git log --oneline -20` — the release commit style already in use

If there is no tag, fall back to the last `chore(release)` commit and read forward from it. If neither exists, every commit in the log is unreleased. In a monorepo, scope the range to the app's path — `git log --oneline <last-release>..HEAD -- apps/web` — plus any shared package it imports whose changes reach its users.

`package.json` is the one source of truth. Everything else that shows a version follows it and never disagrees with it — a footer, an About page, a `/api/health` or `/api/version` route handler, an error-reporting `release` tag, a Docker image tag.

## Step 2 — Read the Commits, Not the Feelings

Classify every unreleased commit by the impact it has on someone who depends on this app — a user with a bookmark, a site that links or embeds it, a backend that calls its route handlers, a deployer who configures it. The commit type is the starting evidence, not the verdict; read the diff when the type and the impact disagree.

```text
MAJOR.MINOR.PATCH
```

| Bump  | Meaning                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------- |
| MAJOR | Something that worked before stops working, or works differently, without action from someone else |
| MINOR | New capability, or reshaped internals, with everything that worked before still working              |
| PATCH | Existing behavior made correct, safer, or better, with nothing new to learn                          |

### MAJOR — breaking

Increment when the upgrade demands action from someone:

- **A URL stops resolving** — a page route under `app/` or `pages/` is removed, renamed, or moved, a dynamic segment changes (`[id]` → `[slug]`), or a search param a link depends on changes meaning — without a redirect in `next.config` or middleware
- **A route handler changes contract** — an `app/**/route.ts` or `pages/api/*` endpoint is removed, renamed, changes method, or changes request or response shape
- **A server action changes contract** — a used action is removed, renamed, or its arguments or return shape change
- **Middleware changes who gets in** — a matcher, rewrite, redirect, or auth check that changes which requests reach which pages
- **Authentication or session behavior changes** — sign-in flow, cookie names, session shape, protected-route rules
- **Configuration a deployer owns changes** — an environment variable (`NEXT_PUBLIC_*` or server-only) becomes required, is renamed, changes meaning, or is dropped; `basePath`, `assetPrefix`, `i18n` locales, `output` mode, or `images.remotePatterns` change in a way that breaks a running deployment
- **The runtime floor moves** — the `engines.node` minimum rises, or the deploy target changes (Edge vs Node runtime, static export vs server)
- **A framework major lands** — upgrading `next` or `react` across a major version
- **Stored state stops loading** — a `localStorage`, cookie, or URL-encoded state shape that users already have saved changes incompatibly
- **A feature is removed**

**Do not declare a MAJOR bump on your own judgment.** If the developer has said this release is breaking, or a commit carries `!` or a `BREAKING CHANGE:` footer, it is MAJOR. If you believe a change is breaking and neither is true — a route rename filed as a `refactor` is the common case — stop and ask. A wrongly declared major is as expensive as a missed one.

`1.5.0 → 2.0.0` — minor and patch reset to zero.

### MINOR — additive or structural

Increment when the app gains something, or is rebuilt without changing what it does:

- A new page, layout, route segment, route handler, server action, or component users can reach
- A route moved **with** a permanent redirect from the old URL
- A new optional environment variable or config with a working default
- A new response field from a route handler that existing callers can ignore
- A refactor, restructure, or rewrite that leaves behavior identical — Pages Router to App Router with every URL preserved, client to server components, a state-management swap
- A dependency upgrade that changes internals but not behavior, including `next` or `react` minor versions
- A deprecation announced but not yet enforced

`1.5.0 → 1.6.0` — patch resets to zero.

Refactors count as MINOR in this system. A restructure no user can observe still changes the code someone will deploy and debug, and it deserves a number that says so.

### PATCH — corrective

Increment when existing behavior is repaired or sharpened:

- A bug fix — rendering, hydration mismatch, data fetching, caching or revalidation, form handling
- A security fix that does not change an interface
- A performance fix — bundle size, image optimization, streaming, fewer re-renders, a faster query
- An enhancement to something that already exists — a clearer message, a tighter validation, a better empty or loading state, a corrected label, an accessibility fix, a style polish

`1.5.2 → 1.5.3`

### No bump

Changes that never reach the deployed app carry no version:

- Documentation, comments, and context files
- Tests and test fixtures, Storybook stories
- Formatting and lint-only changes
- CI configuration, local tooling, editor settings
- Dev-only dependency upgrades that do not change the build output
- `wip` commits

A release that contains only these does not happen. If the developer asks for one anyway, say so and ask what they intend to release.

## Step 3 — Take the Highest Impact, Once

The release takes **one** bump: the largest classification present in the range, applied a single time.

Twelve fixes and one feature is a MINOR bump, not a MINOR and twelve PATCHes. One breaking change buried under thirty features is a MAJOR bump. Count the ceiling, not the commits.

If two levels look equally defensible, choose the higher one. Over-promising an upgrade's impact costs a re-read of the release notes; under-promising costs a broken deploy.

## Step 4 — Pre-Release and Build Metadata

Use a pre-release identifier only when the developer asks for one, or when the release is deliberately unstable — a preview deployment, a beta channel:

```text
2.0.0-alpha.1   → early, expected to break
2.0.0-beta.3    → feature-complete, still validating
2.0.0-rc.1      → believed shippable, awaiting confirmation
```

A pre-release sorts below its final version, so `2.0.0-rc.1` precedes `2.0.0`. Never ship a pre-release identifier as a stable release, and never carry one forward — `2.0.0-rc.2` becomes `2.0.0`, not `2.0.1`.

Do not use build metadata (`+sha`) in `package.json`. If deployments need the commit, read it at build time from the platform (for example `VERCEL_GIT_COMMIT_SHA`) — never write it into the version.

## Step 5 — Apply the Bump

Change the version where the version lives, and nowhere else by hand. Run from the app's directory.

| Package manager | Command | Files that change |
|-----------------|---------|-------------------|
| npm | `npm version <major\|minor\|patch> --no-git-tag-version` | `package.json`, `package-lock.json` (top-level `version` and the root `packages[""]` entry) |
| pnpm, yarn, bun | Edit the `version` field in `package.json` | `package.json` only — these lockfiles do not record the app's own version |

Set the number by hand with npm only when `npm version` cannot express the target — a pre-release transition, a correction to a mistaken bump — and then update both places in `package-lock.json` to match.

**How the version reaches the UI.** If the app displays or reports its version, it must read it from `package.json` at build time — typically in `next.config` (in `next.config.ts`, drop the `with { type: "json" }`):

```js
// next.config.mjs
import pkg from "./package.json" with { type: "json" };

const nextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
};
```

Search for literals before committing — `grep -rn "<old version>" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" . --exclude-dir=node_modules --exclude-dir=.next`. A component, route handler, or `.env` file carrying its own copy of the number is a second source of truth: replace it with the build-time value in this release.

Verify with `git diff` before committing, and confirm the new number appears once in `package.json` (and in both `package-lock.json` positions with npm). Never tag, never push, never publish, never deploy. Tagging and releasing are the developer's call.

## Step 6 — Commit the Bump

The version bump is its own commit, containing nothing but the version change and the release notes:

```text
chore(release): bump version to 1.6.0
```

In a monorepo with more than one app, name the app as the scope: `chore(release): bump web to 1.6.0`.

It is the last commit of the release — everything it describes is already committed beneath it. A bump commit that carries feature code is a lie about what the release contains.

If the developer wants the release notes in the commit body, keep them short and grouped by impact:

```text
chore(release): bump version to 1.6.0

Added: request filtering by review round
Fixed: hydration mismatch on the dashboard date header
```

## Step 7 — Keep the Documents Honest

A release that changes documented behavior is not finished until the documents agree with it. Before reporting, check whether this release invalidated:

- The README, or `.env.example` — every new, renamed, or removed environment variable appears there
- A deployment runbook — new build settings, Node version, or required platform configuration
- A changelog or release document that records the current number

Corrections go in their own `docs` commit, scoped to what they document, committed before the bump commit.

For a MAJOR release, the migration path is not optional. Name what breaks and what someone must do about it — the old URL and its replacement, the renamed variable and its new name, the new Node minimum. A breaking change without instructions is an outage waiting for someone else's morning.

## Step 8 — Report

State the decision and the evidence for it:

```
## Version

web: 1.5.0 → 1.6.0 (minor)

Highest impact: feat(requests) — filter requests by review round
Also included: 3 fixes, 1 refactor, 2 docs commits

Updated: apps/web/package.json, package-lock.json
Committed: chore(release): bump web to 1.6.0
```

If you did not bump, say what the range contained and why it carries no version.

If you had to ask about a breaking change, report the question and the evidence — the commit, the file, the URL or contract that changes — not a guessed number.

## What This Skill Is Not

This is not for backends, libraries, or non-Next frontends. It versions one Next.js app.

This is not a tagging, publishing, or deploying step. No `git tag`, no `npm publish`, no `git push`, no `vercel deploy`.

This is not a changelog generator. Release notes are written when the developer asks for them, from the commits, in this app's own vocabulary.

This is not a per-commit bump. The version moves once per release, no matter how many commits the release contains.
