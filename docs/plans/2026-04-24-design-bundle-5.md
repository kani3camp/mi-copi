# DESIGN Bundle 5: Keyboard Training UI Alignment

## Goal
- `DESIGN.md` の bundle 5 として、`/train/keyboard` の `config / preparing / playing / answering` UI を keyboard-first に揃える

## Why now
- distance training のテンポと hierarchy を揃えたため、次はもう一つの主導線である keyboard training を同じ基準に引き上げる必要がある

## References
- `DESIGN.md`
- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/route-status.md`
- `docs/delivery/acceptance-criteria.md`

## In scope
- `/train/keyboard` の config phase を grouped card と segmented control に整理する
- progress header に question / timer / running score の優先度を反映する
- keyboard answer pad を CSS class ベースへ寄せ、基準音キーの全面ハイライトを導入する
- keyboard presenter / stories / tests を bundle 5 の UI 契約に合わせて更新する

## Out of scope
- keyboard feedback / result / save-status UI の再設計
- auth / DB / persistence / URL / schema の変更
- 依存追加、font loading、dark mode

## Files likely touched
- `docs/plans/2026-04-24-design-bundle-5.md`
- `src/app/globals.css`
- `src/app/train/keyboard/keyboard-train-client.tsx`
- `src/app/train/keyboard/keyboard-train-panels.tsx`
- `src/app/train/keyboard/keyboard-train-panels.stories.tsx`
- `src/app/train/keyboard/keyboard-train-presenter.ts`
- `src/app/train/keyboard/keyboard-train-presenter.test.ts`

## Verification
- `npm run verify`
- `npm run build-storybook`
- Storybook で `Train/Keyboard/Panels` と `Train/TrainingProgressHeader` を確認する
- guest の `/train/keyboard` を `375px / 390px / 430px` 想定で quick smoke する

## Human approval needed?
- なし
