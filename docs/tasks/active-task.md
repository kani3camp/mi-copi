# Active Task

## Goal

Reduce docs drift around the shipped app so the next Codex session can identify current routes, persistence behavior, and repo entrypoints without rereading the whole codebase first.

## Why Now

The repo already has working home / settings / stats / training flows, but the top-level entry docs still read like an earlier implementation phase.
That makes it easy to mistake old PR sequencing memos for the current backlog or miss which routes are already implemented.

## References

- `README.md`
- `docs/README.md`
- `docs/product/current-constraints.md`
- `docs/product/decision-log.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/product/tech-stack.md`
- `docs/product/ui-system.md`
- `docs/delivery/acceptance-criteria.md`
- `docs/delivery/pr-plan.md`
- `docs/implementation/route-status.md`
- `src/app/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/stats/page.tsx`
- `src/app/train/distance/page.tsx`
- `src/app/train/keyboard/page.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- `src/features/training/server/lastUsedTrainingConfig.ts`
- `src/features/settings/server/global-user-settings.ts`

## In Scope

- refresh repo entry docs so a newcomer can find the right source of truth quickly
- document the current route-level implementation status in one place
- align README, docs overview, and active-task wording around product truth vs implementation bridge vs delivery memo
- add only implementation-backed clarifications to constraints when they prevent avoidable confusion

## Out Of Scope

- application code changes
- dependency changes
- env var changes
- auth / schema / migration meaning changes
- rewriting every implementation bridge doc in one pass
- deciding new product scope from undocumented assumptions

## Likely Touched Files

- `README.md`
- `docs/README.md`
- `docs/product/current-constraints.md`
- `docs/implementation/route-status.md`
- `docs/delivery/pr-plan.md`
- `docs/tasks/active-task.md`

## Verification

- read-through consistency check across README, docs overview, active task, and referenced product docs
- cross-check route / persistence statements against the current implementation
- run `git diff --check`

## Human Approval Needed?

- No, unless the docs reveal a product-level contradiction that cannot be resolved from code and existing canonical docs.

## Completion Definition

- `README.md` works as a practical repo entrypoint
- `docs/README.md` clearly distinguishes product truth, implementation bridge, and delivery aids
- `docs/implementation/route-status.md` gives a reliable route-level snapshot of the shipped app
- `docs/tasks/active-task.md` no longer points at already-completed early-stage implementation bundles
