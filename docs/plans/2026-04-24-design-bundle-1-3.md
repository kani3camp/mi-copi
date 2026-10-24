# DESIGN Bundle 1-3 実装反映

## Goal
- `DESIGN.md` の bundle 1-3 を実装し、`theme tokens + global theme layer + repo-owned UI primitives + Home/Settings refresh` を 1 責務で反映する

## Why now
- 旧来の保守的な配色・フォント・色意味づけが残っており、後続の training / stats / session detail bundle に進む前に、UI の土台を `DESIGN.md` に揃える必要がある

## References
- `DESIGN.md`
- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/route-status.md`
- `docs/delivery/acceptance-criteria.md`

## In scope
- `src/app/globals.css` に semantic token と global theme layer を追加し、旧 CSS 変数は alias として維持する
- `src/app/ui/*` の `Button` / `Chip` / `Notice` / `Surface` / `ActionCard` / `Field` / `SummaryStat` / `ButtonLink` の見た目を `DESIGN.md` に寄せる
- `src/app/ui/primitives.tsx` に controlled な `SegmentedControl` を追加する
- `src/app/page.tsx` を refresh し、スマホ 1st viewport を練習開始優先の構成へ寄せる
- `src/app/settings/page.tsx` と `src/app/settings/global-settings-section.tsx` を refresh し、`global settings -> per-mode saved config -> account summary` の順へ整理する
- Storybook の primitives / navigation / reset button を更新し、`SegmentedControl` story を追加する

## Out of scope
- `/train/*`, `/stats`, `/sessions/[sessionId]`, `/login` の個別レイアウト刷新
- auth / DB / server action / URL / persistence contract の変更
- font loading の追加、依存追加、dark mode、chart redesign
- legacy mode accent (`teal` / `blue` など) の全面整理

## Files likely touched
- `docs/plans/2026-04-24-design-bundle-1-3.md`
- `src/app/globals.css`
- `src/app/ui/styles.ts`
- `src/app/ui/primitives.tsx`
- `src/app/ui/primitives.stories.tsx`
- `src/app/page.tsx`
- `src/app/settings/page.tsx`
- `src/app/settings/global-settings-section.tsx`
- `src/app/settings/reset-config-submit-button.tsx`

## Verification
- `npm run verify`
- `npm run verify:storybook`
- Storybook で `primitives`, `navigation-link`, `reset-config-submit-button`, `SegmentedControl` を確認する
- `375px / 390px / 430px` を基準に `/` と `/settings` を quick visual smoke する
- `/login`, `/train/distance`, `/train/keyboard`, `/stats` を quick visual smoke し、token 差し替えの破綻がないことを確認する

## Human approval needed?
- なし
