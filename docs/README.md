# Docs Overview

`docs/` は product truth、implementation bridge、delivery memo を分けて置くためのディレクトリです。

repo の実行ルール、承認境界、報告形式は先に `AGENTS.md` を読みます。そのうえで、仕様判断は canonical docs から行ってください。

## Read Order

1. `AGENTS.md`
2. `docs/product/current-constraints.md`
3. `docs/product/decision-log.md`
4. `docs/product/requirements.md`
5. `docs/product/basic-design.md`
6. `docs/product/tech-stack.md`
7. `docs/product/ui-system.md`
8. `docs/delivery/acceptance-criteria.md`
9. `docs/delivery/pr-plan.md`

## Doc Roles

- `docs/product/*`
  - 仕様、固定制約、UX 方針の正本
  - 実装が違って見えた場合でも、まずこちらを優先して確認する
- `docs/implementation/*`
  - product docs をコードに落とすための bridge
  - `docs/implementation/route-status.md` は現在の route / persistence / page-level 実装の見取り図
- `docs/delivery/*`
  - 受け入れ条件や PR 分割などの delivery 補助メモ
  - 現在の backlog や product scope の正本ではない
- `docs/tasks/active-task.md`
  - いま進める bundle を 1 つだけ示す live memo
  - product truth ではない
- `docs/plans/*`
  - 長時間または複数セッションにまたがる作業の plan
  - `docs/tasks/active-task.md` より優先しない
- `docs/architecture/*`
  - 旧リンク互換用の補助配置
  - canonical docs としては扱わない

## Working Notes

- non-trivial work は Plan mode から始める
- いま着手する bundle は `docs/tasks/active-task.md` を先に確認する
- 長時間または複数セッション作業だけ `docs/plans/*.md` を持つ
- route の現在地、保存挙動、実装済み画面の確認は `docs/implementation/route-status.md` を起点にする
- UI の見た目、トークン、参照基準を判断するときは `docs/product/ui-system.md` を追加で読む
- browser QA の完了有無は `docs/implementation/route-status.md` の注記と実際の検証結果を優先する

## Verification

- 標準 scripts は `package.json` を参照する
- 日常の総合検証は `npm run verify`
- Biome の write/read-only チェックは `npm run format`、`npm run lint`、`npm run check` に分かれている
