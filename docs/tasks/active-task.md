# active-task

## 目的
docs の source of truth を一本化し、Biome を導入して、Codex 主体開発の verify 基盤を標準化する。

## 今回の対象
- `docs/README.md` の正本参照先を repo 実態に合わせて修正
- task 正本を `docs/tasks/active-task.md` に統一
- `AGENTS.md` / docs / README の参照先と検証コマンドの整合を取る
- Biome を導入し、format / lint / check / verify の script を整理する
- 既存の repo 固有 lint が必要なら `lint:repo` などへ分離する
- 必要に応じて最小限の ignore / config を追加する
- 余力があれば GitHub Actions で verify + build を追加する

## 今回はやらないこと
- 新機能実装
- settings / stats / training UI の本実装
- audio-engine 実装
- scoring ロジック拡張
- schema 意味変更

## 受け入れ条件
- docs の source of truth が repo 内で一貫している
- `docs/tasks/active-task.md` が task 正本として使われる
- Biome が導入され、repo で実行可能
- `lint` / `format` / `check` / `verify` の責務が明確
- `verify` で最低限の品質ゲートを一通り回せる
- README / AGENTS / docs のコマンド説明が repo 実態と矛盾しない
- 新規依存追加がある場合は人間確認事項として明示する
- 余力で CI を追加した場合、verify + build が自動実行される

## 人間確認が必要なこと
- 新規依存追加
- CI 追加で secrets や外部設定が必要になる場合のみ

## 完了報告
AGENTS.md の最小完了報告フォーマットに従うこと