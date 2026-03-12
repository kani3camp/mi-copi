# Docs Overview

`docs/` contains the repository source of truth.

## Canonical Order
1. `docs/product/current-constraints.md`
2. `docs/product/decision-log.md`
3. `docs/product/requirements.md`
4. `docs/product/basic-design.md`
5. `docs/product/tech-stack.md`
6. `docs/product/ui-system.md`
7. `docs/delivery/acceptance-criteria.md`
8. `docs/delivery/pr-plan.md`
9. `AGENTS.md`

`docs/product/*` が仕様と UX 方針の正本、`docs/implementation/*` がその実装ブリッジです。
UI の見た目・トークン・参照基準を判断するときは `docs/product/ui-system.md` を追加で読むこと。

## Plans
- Non-trivial work should start with Codex Plan mode.
- Only long-running or multi-session work should create a persistent plan under `docs/plans/*.md`.
- `docs/tasks/active-task.md` is the current bundle memo for Codex. Product truth is still decided by the canonical docs above.

## Supporting Docs

- `docs/implementation/*.md`
  - Implementation-level contracts and design details derived from the product docs.
- `docs/product/ui-system.md`
  - Shared UI/UX criteria and initial design tokens for humans and Codex.
- `docs/delivery/*.md`
  - Delivery process notes, acceptance templates, and PR planning aids.
- `docs/architecture/*.md`
  - Legacy compatibility pointers kept only so older links still resolve. Do not treat them as canonical.

## Verification

- Standard repo scripts live in `package.json`.
- Daily Codex verification should use `npm run verify`.
- Biome write/read-only checks are split into `npm run format`, `npm run lint`, and `npm run check`.
