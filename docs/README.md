# Docs Overview

`docs/` contains the repository source of truth. The canonical reading order matches `AGENTS.md`.

## Canonical Order

1. `docs/tasks/active-task.md`
   - Current task scope, in-scope/out-of-scope, and acceptance criteria.
2. `docs/product/current-constraints.md`
   - Fixed product, architecture, and AI-development constraints currently in force.
3. `docs/product/decision-log.md`
   - Decision history that resolves implementation ambiguity.
4. `docs/product/requirements.md`
   - Product goals, scope, and MVP behavior requirements.
5. `docs/product/basic-design.md`
   - Screen structure, routing, state transitions, and client/server responsibilities.
6. `docs/product/tech-stack.md`
   - Adopted technologies and the development quality strategy.
7. `AGENTS.md`
   - Execution policy, approval boundaries, verification, and reporting rules.

## Supporting Docs

- `docs/implementation/*.md`
  - Implementation-level contracts and design details derived from the product docs.
- `docs/delivery/*.md`
  - Delivery process notes, acceptance templates, and PR planning aids.
- `docs/architecture/*.md`
  - Legacy compatibility pointers kept only so older links still resolve. Do not treat them as canonical.

## Verification

- Standard repo scripts live in `package.json`.
- Daily Codex verification should use `npm run verify`.
- Biome write/read-only checks are split into `npm run format`, `npm run lint`, and `npm run check`.
