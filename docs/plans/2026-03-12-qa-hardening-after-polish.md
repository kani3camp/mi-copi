# QA Hardening After Visual Polish

## Goal

Verify the post-polish app end to end on the MVP flows, fix only regressions or UX breaks found, and leave the repo in a shippable state without expanding product scope.

## Why Now

The core milestones are implemented and the largest remaining risk is unverified UI and interaction behavior after the whole-app visual refactor.

## References

- `docs/product/ui-system.md`
- `docs/delivery/acceptance-criteria.md`
- `docs/plans/2026-03-12-whole-app-design-polish.md`

## In Scope

- preflight cleanup for generated `next-env.d.ts` noise
- route-by-route QA of home, login, settings, stats, session detail, distance training, and keyboard training
- localized UI and state fixes found during verification
- targeted tests only when bug fixes touch logic

## Out Of Scope

- redesign work beyond regressions
- new dependencies
- env var changes
- migrations
- contract or API expansion
- broad docs cleanup unrelated to discovered bugs

## Verification

- run the app locally and inspect the required routes
- verify mobile-first widths `375px`, `390px`, `430px`, plus one desktop fallback
- run `npm run typecheck`
- run `npm run check`
- run `npm run lint:repo`
- run `npm run build`
- prefer `npm run verify` before completion

## Human Approval Needed?

- No, unless browser-based verification requires a capability unavailable inside the current sandbox.

## Execution Notes

- 2026-03-12: repo hygiene fix として `biome.json` から `storybook-static` を除外し、標準 verify が生成物で汚れない状態に更新
- 2026-03-12: training server read paths の `noExplicitAny` を除去し、mock DB と Drizzle 実行の両方を扱う細い query 型へ置換
- 2026-03-12: numeric DB rows を string でも正規化できるよう read-path tests を更新
- 2026-03-12: headless Chromium で guest browser QA を実施
  - route widths: `375px`, `390px`, `430px`, `1024px`
  - route coverage: `/`, `/login`, `/settings`, `/stats`, `/train/distance`, `/train/keyboard`, invalid `/sessions/[sessionId]`
  - flow coverage: guest settings local persistence、distance / keyboard 5 問完走、distance `time_limit=60s`
  - signed-in browser QA は未実施
