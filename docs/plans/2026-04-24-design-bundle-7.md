# DESIGN Bundle 7: Stats / Session Detail Alignment

## Summary

- Goal: `/stats` and `/sessions/[sessionId]` を `DESIGN.md` の stats / session detail ルールへ揃える。
- Why now: bundle 1-6 で theme, primitives, home/settings, training, result が揃ったため、残る記録系画面を同じ visual family に合わせる。
- References: `DESIGN.md`, `docs/product/requirements.md`, `docs/product/basic-design.md`, `docs/delivery/acceptance-criteria.md`.

## Scope

- Stats は cumulative score を headline にし、score trend / support charts / mode and recent summaries / direction and bias / recent sessions を mobile-first に整理する。
- Session detail は session summary -> config snapshot -> per-question results の順を維持し、score hero と grouped config snapshot、compact result cards に刷新する。
- Existing server read models and aggregation output are reused as-is.

## Out of Scope

- New chart library or UI dependency.
- DB schema, auth, URL, save contract, or aggregation semantics changes.
- New period filters, ranks, weak-interval extraction, pre-aggregation, or background jobs.

## Verification

- `npm run verify`
- `npm run build-storybook`
- `npm run test:storybook` when environment allows Playwright Chromium to launch.
- Mobile visual smoke for `/stats` and `/sessions/[sessionId]` where local auth/session data is available.

## Human Approval Needed

- None.
