# active-task

## 目的
Codex 主体開発の品質ゲートを整えるため、lint / test の実行基盤と最小限の unit test を整備し、AGENTS.md の基本検証を実際に満たせる状態にする。

## 今回の対象
- package.json の lint / test script 整備
- 必要なら lint / test の設定ファイル整備
- 最低限の unit test 追加
- AGENTS.md の検証方針と repo 実態の整合調整
- 必要なら README または docs の最小更新

## 今回はやらないこと
- 新機能実装
- UI 実装
- audio-engine 実装
- stats 実装の拡張
- 大規模リファクタ

## 受け入れ条件
- lint script が実行できる
- test script が実行できる
- 最低1本以上の unit test が通る
- typecheck / lint / test の基本検証が repo 上で実行可能になっている
- AGENTS.md の検証方針が repo 実態と矛盾しない

## 人間確認が必要なこと
- 新規依存追加が必要な場合のみ確認する

## 完了報告
AGENTS.md の最小フォーマットに従うこと