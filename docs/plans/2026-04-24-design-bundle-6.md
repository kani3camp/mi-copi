# DESIGN Bundle 6: Feedback / Result / Save Status UI Alignment

## Goal
- `DESIGN.md` の bundle 6 として、distance / keyboard 両モードの `feedback / result / save-status` UI を共通方針で揃える

## Why now
- active training loop の hierarchy は揃ったため、次は回答後の理解速度と保存状態の明確さを上げて、結果画面の動機づけを整える

## References
- `DESIGN.md`
- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/product/basic-design.md`
- `docs/implementation/route-status.md`
- `docs/delivery/acceptance-criteria.md`

## In scope
- feedback status chip を explicit state に揃える
- distance / keyboard の feedback panel を一目で読める hierarchy に寄せる
- result panel の hero metric / supporting stats / next-session CTA を refresh する
- result save status を inline card として明示する

## Out of scope
- training config / answering UI の再調整
- auth / DB / persistence / URL / schema の変更
- stats / session detail の refresh

## Files likely touched
- `docs/plans/2026-04-24-design-bundle-6.md`
- `src/app/globals.css`
- `src/app/ui/primitives.tsx`
- `src/app/train/train-ui-shared.tsx`
- `src/app/train/train-ui-shared.test.ts`
- `src/app/train/distance/distance-train-panels.tsx`
- `src/app/train/distance/distance-train-panels.stories.tsx`
- `src/app/train/keyboard/keyboard-train-panels.tsx`
- `src/app/train/keyboard/keyboard-train-panels.stories.tsx`

## Verification
- `npm run verify`
- `npm run build-storybook`
- Storybook で distance / keyboard panel stories を確認する
- guest の `/train/distance` と `/train/keyboard` result / feedback を quick smoke する

## Human approval needed?
- なし
