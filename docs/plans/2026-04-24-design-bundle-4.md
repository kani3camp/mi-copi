# DESIGN Bundle 4: Distance Training UI Alignment

## Goal
- `DESIGN.md` の bundle 4 として、`/train/distance` の `config / preparing / playing / answering` UI を distance-first で揃える

## Why now
- training bundle に進む前段で共通 token と Home / Settings の基盤は揃ったため、次は最も利用頻度が高い distance training の回答テンポとモバイル可読性を上げる

## References
- `DESIGN.md`
- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/route-status.md`
- `docs/delivery/acceptance-criteria.md`

## In scope
- `/train/distance` の config phase を grouped card + compact segmented control に整理する
- progress header に question / timer / running score の優先度を反映する
- replay row と distance answer grid を `DESIGN.md` 準拠の compact / tactile な見た目へ更新する
- distance presenter / stories / tests を bundle 4 の UI 契約に合わせて更新する

## Out of scope
- keyboard training の screen-specific tuning
- feedback / result / save-status UI の再設計
- auth / DB / persistence / URL / schema の変更
- 依存追加、font loading、dark mode

## Files likely touched
- `docs/plans/2026-04-24-design-bundle-4.md`
- `src/app/globals.css`
- `src/app/train/training-page-shell.tsx`
- `src/app/train/train-ui-shared.tsx`
- `src/app/train/distance/distance-train-client.tsx`
- `src/app/train/distance/distance-train-presenter.ts`
- `src/app/train/distance/distance-train-panels.tsx`
- `src/app/train/distance/distance-train-panels.stories.tsx`
- `src/app/train/training-page-shell.stories.tsx`
- `src/app/train/distance/distance-train-presenter.test.ts`

## Verification
- `npm run verify`
- `npm run build-storybook`
- Storybook で `Train/TrainingProgressHeader` と `Train/Distance/Panels` を確認する
- guest の `/train/distance` を `375px / 390px / 430px` 想定で quick smoke する

## Human approval needed?
- なし
