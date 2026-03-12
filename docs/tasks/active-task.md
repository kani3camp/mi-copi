# Active Task

## Goal

Align the canonical docs so Codex can start the next implementation bundle without source-of-truth ambiguity.

## Why Now

The next recommended implementation step is the Schema / Types / Contracts bundle.
Before that starts, the repo needs one consistent doc set for UI rules, scoring, route state, save payloads, and terminology.

## References

- `docs/product/current-constraints.md`
- `docs/product/decision-log.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/product/tech-stack.md`
- `docs/product/ui-system.md`
- `docs/delivery/acceptance-criteria.md`
- `docs/delivery/pr-plan.md`
- `docs/implementation/api-contracts.md`
- `docs/implementation/db-schema.md`
- `docs/implementation/training-flow.md`
- `docs/implementation/scoring.md`
- `docs/implementation/ts-types.md`

## In Scope

- remove stale terminology from canonical docs
- make `ui-system` part of the source-of-truth path
- align scoring, TS contract types, and related implementation docs
- leave a clear docs entrypoint for the next implementation bundle

## Out Of Scope

- application code changes
- migration work
- dependency changes
- env var changes
- score-meaning changes beyond clarifying the existing v1 formula

## Likely Touched Files

- `AGENTS.md`
- `docs/README.md`
- `docs/product/ui-system.md`
- `docs/product/basic-design.md`
- `docs/implementation/api-contracts.md`
- `docs/implementation/training-flow.md`
- `docs/implementation/scoring.md`
- `docs/implementation/ts-types.md`
- `docs/tasks/active-task.md`

## Verification

- read-through consistency check across product and implementation docs
- search for stale cent-based, minute-based, or retired enum terminology
- run repo-level doc-safe verification scripts as appropriate

## Human Approval Needed?

- No, unless canonical docs reveal a contradiction that cannot be resolved safely from the repo source of truth.

## Completion Definition

- canonical docs agree on UI policy, scoring, route state, and save payload terminology
- `docs/product/ui-system.md` is reachable from the standard docs entrypoints
- `docs/implementation/scoring.md` and `docs/implementation/ts-types.md` match the confirmed MVP spec
- Codex can move directly into the next implementation bundle with no extra spec cleanup step
