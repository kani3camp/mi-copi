# Active Task

## Goal

Reduce docs drift around the shipped app so the next Codex session can identify the canonical docs, current routes, and persistence behavior without re-reading the whole codebase first.

## Why Now

The app already ships home, login, settings, stats, distance training, keyboard training, and saved-session detail flows.
Some entry docs still read like an earlier milestone sequence, which makes it too easy to mistake historical delivery memos for the live bundle or miss current route behavior.

## References

- `README.md`
- `docs/README.md`
- `docs/product/current-constraints.md`
- `docs/product/decision-log.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/delivery/acceptance-criteria.md`
- `docs/delivery/pr-plan.md`
- `docs/implementation/route-status.md`
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/stats/page.tsx`
- `src/app/train/distance/page.tsx`
- `src/app/train/distance/distance-train-client.tsx`
- `src/app/train/keyboard/page.tsx`
- `src/app/train/keyboard/keyboard-train-client.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- `src/app/auth-test/page.tsx`
- `src/features/training/server/lastUsedTrainingConfig.ts`
- `src/features/settings/server/global-user-settings.ts`

## In Scope

- refresh repo entry docs so a newcomer can find the right source of truth quickly
- clarify the roles of `product`, `implementation`, `delivery`, and `tasks` docs
- update the route-level implementation snapshot to match current shipped behavior
- document guest vs signed-in persistence behavior where it prevents avoidable misreads
- make `active-task.md` itself reflect this docs bundle instead of old milestone language

## Out Of Scope

- application code changes
- dependency changes
- env var changes
- auth / schema / migration meaning changes
- full rewrite of all implementation bridge docs
- deciding new product scope from undocumented assumptions

## Likely Touched Files

- `README.md`
- `docs/README.md`
- `docs/implementation/route-status.md`
- `docs/tasks/active-task.md`
- `docs/delivery/pr-plan.md`
- `docs/product/current-constraints.md` only if a tiny implementation-backed clarification is needed

## Verification

- read-through consistency check across `README.md`, `docs/README.md`, `docs/tasks/active-task.md`, and `docs/implementation/route-status.md`
- cross-check route and persistence statements against the current implementation
- re-check README script names against `package.json`
- run `git diff --check`

## Human Approval Needed?

- No, unless the docs reveal a product-level contradiction that cannot be resolved from code and canonical product docs.

## Completion Definition

- `README.md` works as a practical repo entrypoint for humans and Codex
- `docs/README.md` clearly separates product truth, implementation bridge, delivery memo, and active bundle memo
- `docs/implementation/route-status.md` is a reliable current snapshot for routes and persistence behavior
- `docs/tasks/active-task.md` points at this docs-alignment bundle rather than completed early-stage sequencing
