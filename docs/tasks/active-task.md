# Active Task

このファイルは、いま着手すべき bundle を 1 つだけ示す live memo です。
product truth ではありません。仕様判断は引き続き `docs/product/*` を参照してください。

## Current Bundle

### Title

開発導線整理

### Goal

- product route と developer utility route の境界を repo 内で分かりやすくし、次の小規模 bundle を 1 責務で進められる状態にする

### Why now

- `docs/delivery/pr-plan.md` と `docs/README.md` はこのファイルを live bundle memo として参照していたが、実体が欠けていた
- route status 上、`/auth-test` は実装済みの developer utility として残っており、product scope と混同しない整理が次の自然な小規模 bundle になっている
- QA hardening は直近の修正と plan にすでに反映されており、次 bundle の主題としては重複する

### References

- `docs/product/current-constraints.md`
- `docs/product/requirements.md`
- `docs/implementation/route-status.md`
- `docs/delivery/pr-plan.md`
- `src/app/auth-test/page.tsx`

### In scope

- `/auth-test` を developer utility としてどう扱うかの docs / 導線整理
- product route と utility route の境界明文化
- 必要なら関連する軽微な文言整理

### Out of scope

- 新しい product 機能追加
- DB schema、auth 設定、保存契約、score 式の変更
- 広範囲な QA 再実施
- 大規模な UI polish

### Files likely touched

- `docs/implementation/route-status.md`
- `docs/delivery/pr-plan.md`
- `docs/README.md`
- `src/app/auth-test/*`
- 必要なら developer utility を参照する周辺 route

### Verification

- docs 間の参照と role 説明に矛盾がないことを確認する
- developer utility と product route の区別が、関連 docs と画面文言で一致していることを確認する
- 変更が code に及ぶ場合のみ、影響範囲の最小検証を行う

### Human approval needed?

- 不要

## Plan Inventory

- Done or superseded:
  - `docs/plans/2026-03-12-whole-app-design-polish.md`
  - `docs/plans/2026-03-12-qa-hardening-after-polish.md`
  - `docs/plans/2026-03-12-training-config-contract-alignment.md`
  - `docs/plans/2026-03-12-training-config-latest-only-migration.md`
  - `docs/plans/2026-03-12-save-validation-hardening.md`
- Audit reference only:
  - `docs/plans/2026-03-12-training-config-contract-audit.md`
