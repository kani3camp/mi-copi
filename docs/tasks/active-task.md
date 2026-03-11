# active-task

## 目的
MVP の永続化と認証連携の土台として、Better Auth / Drizzle 初期設定、およびアプリ固有テーブルのスキーマと主要 TypeScript 型の初稿を整備する。

## 今回の対象
- Better Auth の導入状態確認と不足分の整備
- Drizzle の初期設定
- `user_settings` テーブル定義
- `training_sessions` テーブル定義
- `question_results` テーブル定義
- 上記に対応する主要 TypeScript 型の初稿
- schema / migration 整合確認に必要な最小限の設定・確認

## 今回はやらないこと
- audio-engine 実装
- question-generator / answer-evaluator / scoring の本実装
- training UI 実装
- stats UI 実装
- E2E 実装の本格追加
- 新しい分析指標の追加設計

## 受け入れ条件
- Better Auth とアプリ固有テーブルの責務分離が守られている
- `user_settings` / `training_sessions` / `question_results` の Drizzle schema が定義されている
- 各テーブルが Better Auth の `user` を親として正しく関連づいている
- session 終了時一括保存を前提にしたデータ粒度になっている
- 後からスコア再計算や統計集計ができる raw data を保持できる
- 主要 TS 型が schema と矛盾していない
- 実行可能な範囲で typecheck / lint / schema 整合確認が通る

## 必須検証
- package.json に合わせた typecheck
- package.json に合わせた lint
- schema / migration 整合確認
- 実行可能なら最小限の unit test

## 人間確認が必要なこと
- env 追加 / 変更
- migration 適用
- schema の意味変更
- Better Auth の外部設定変更
- 新規依存追加

## 完了報告
AGENTS.md の完了報告フォーマットに従うこと
