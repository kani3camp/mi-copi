# decision-log

## 2026-08-16
### Design System v2
- 決定: Visual Design / Design Language / Design Tokens / Semantic Color / Typography / Spacing / Layout / Component Appearance / Responsive Design / Interaction State / Training固有の視覚表現は Design System v2 を正とする
- 決定: Brand / Primary Action は Azure、Reference は Gold、Correct は Sage、User Answer は Violet、Near は Amber、Incorrect は Rose とし、Brand と学習状態の色を分離する
- 決定: 旧来の「mi-copi = Green」というブランド前提は廃止し、Green 系は Correct の意味に限定する
- 決定: Distance feedback は Interval Ruler を正式な視覚表現とする
- 決定: Keyboard feedback は Reference / Correct / Answer / Exact Match を色だけでなく label / marker / border / shape / role band の組み合わせで表現する
- 決定: v2 モックのサンプルデータ・簡略UI・仮操作は機能仕様と解釈せず、機能・状態遷移・保存・トレーニングロジックは最新の product docs と実装を優先する
- 理由: デザイン成果物の見た目を丸コピーせず、既存の有効なUXと機能を保ったまま再利用可能な Design System としてコードベースへ統合するため
- 影響: `DESIGN.md`, global theme, shared UI primitives, training-specific UI, Storybook, PWA metadata

## 2026-03-10
### train 画面構成
- 決定: train ルートは 1 URL 内の状態切り替えで構成する
- 理由: AI実装時の複雑さを下げ、進行状態管理を単純にするため
- 影響: `src/app/train/*` の画面設計、状態管理方針

### スコア保存精度
- 決定: スコアは DB 保存時も小数で保持し、小数第3位まで扱う
- 理由: 連続問題で丸め誤差を蓄積させないため
- 影響: schema、型、集計、表示処理

### 音源生成方針
- 決定: 音源はサーバー配信ではなく、Web Audio API によりクライアント側で生成する
- 理由: 配信資産管理を避け、構成を軽くするため
- 影響: audio-engine、再生制御、端末互換性考慮
