# ミーコピ UI システム方針 v0.1

## 1. 目的

本ドキュメントは、ミーコピの UI / UX と実装の橋渡しを行うための初期基準書である。

この文書で定めるものは以下の 5 つ。

1. 採用する UI 技術スタック
2. 参照するデザインシステムとその使い分け
3. ミーコピ固有の UI 原則
4. 初版デザイントークン
5. 画像生成 AI / 実装 AI に渡すための共通ルール

本書は「見た目だけの資料」ではなく、Figma 的な検討、画像生成、実装、レビューを同じ語彙でつなぐための運用ドキュメントとする。

---

## 2. 前提

### 2.1 プロダクト前提

- ミーコピは、耳コピのための相対音感トレーニングアプリである
- MVP は Web アプリとして提供する
- UI / UX はスマホブラウザの縦向き利用を最優先とする
- 中核体験は「基準音を聴く → 問題音を聴く → 回答する → 即時フィードバックを得る」である
- 正答率だけでなく、誤差・回答時間・成長推移を重視する
- 回答中は DB に依存せず、テンポを最優先する

### 2.2 開発前提

- 開発は AI 主体で進める
- 型・テスト・小さい PR 単位で品質を担保する
- UI は実装可能性を強く意識し、画像だけ先行して壊れた独自表現を作らない
- コンポーネントは再利用しやすい単位で設計する

---

## 3. 採用スタック

### 3.1 アプリ基盤

- Framework: Next.js App Router
- Language: TypeScript strict
- Hosting: Vercel

### 3.2 UI 実装基盤

- Styling: Tailwind CSS v4
- UI Base: shadcn/ui
- Primitive: Radix UI Primitives
- Icons: lucide-react
- Chart: Recharts
- Animation: 原則 CSS / Tailwind。必要最小限のみ導入

### 3.3 入力 / バリデーション

- React Hook Form
- Zod

### 3.4 認証 / データ

- Auth: Better Auth + Google OAuth
- ORM: Drizzle ORM
- DB: PostgreSQL
- Infra DB: Neon

### 3.5 音関連

- Audio: Web Audio API を主軸とする
- MVP では Tone.js を前提採用しない
- 必要なら将来再評価する

### 3.6 テスト / 品質

- Unit / component test: Vitest
- E2E smoke test: Playwright
- Error monitoring: Sentry

---

## 4. この構成を採用する理由

### 4.1 AI 実装との相性

この構成は、以下の条件を満たすため AI 実装と相性が良い。

- 公式ドキュメントが厚い
- TypeScript により型境界を明確にできる
- shadcn/ui が open code であり、生成後のコードを自前で所有できる
- Radix によりアクセシブルな挙動を既存のプリミティブで安定化できる
- Tailwind により UI 差分をレビューしやすい
- Vercel preview で UI 差分確認を回しやすい

### 4.2 ミーコピとの相性

- トレーニング画面は client-heavy で、音再生と即時反応が重要
- ホーム / 設定 / 統計 / 結果は server-first でよい
- 回答中に DB を触らない設計が必要
- スマホ縦向き最優先のため、Web でも iPhone ライクな情報設計が重要

---

## 5. デザインシステムの参照方針

### 5.1 主軸: Apple Human Interface Guidelines

最も強く参照するのは Apple HIG とする。

目的:
- iPhone らしい自然な余白
- 情報階層の整理
- ナビゲーションの素直さ
- 日常的に使うアプリらしい品位

ミーコピはゲーム UI ではなく、毎日使う習慣化アプリ / ウェルネス寄りアプリとして成立させる。
そのため、見た目の主軸は Apple HIG 的な「静かで自然な完成度」に置く。

### 5.2 品質下限: WCAG 2.2

WCAG 2.2 は hard rule として扱う。

最低限守るもの:
- コントラスト
- タッチターゲットサイズ
- フォーカス可視性
- ラベルの明確さ
- 情報を色だけで伝えないこと

### 5.3 補助参照: Material 3

Material 3 は見た目を真似るためではなく、以下の辞書として参照する。

- state の考え方
- component 分類
- chip / segment / switch / tabs の扱い
- 情報密度の整理

### 5.4 実例参照: Mobbin / Page Flows

実在アプリの空気感を確認する用途で参照する。

見る対象:
- wellness
- health
- finance
- habits
- education

避ける対象:
- gaming
- cyber / neon 系
- 過剰に装飾された concept shot

### 5.5 実装翻訳: shadcn/ui + Radix

画像や参考 UI は、最終的に shadcn/ui + Radix に落とせるものだけ採用する。

つまり、
- 画像でしか成立しない UI は避ける
- 実装時に再現困難な自由形状を避ける
- 複雑なモーション前提の設計を避ける

---

## 6. ミーコピ固有の UI 原則

### 6.1 最重要原則

1. 学習テンポを壊さない
2. 説明を読まなくても進めやすい
3. 数字と成長が読み取りやすい
4. ゲームすぎず、地味すぎない
5. 画像映えより実用性を優先する

### 6.2 目指す印象

- modern
- clean
- calm
- premium
- minimal
- trustworthy
- not gaming
- not neon
- not concept-art

### 6.3 避ける方向

- 音ゲー UI
- ネオン発光
- 粒子や波形を主役にした背景
- ガラス感の強すぎるカード
- プレゼン資料風の多画面コラージュ
- UI kit の寄せ集めに見える構成
- かわいさ優先の丸すぎる見た目

### 6.4 ミーコピらしさの出し方

個性は派手な演出ではなく、以下で出す。

- 音感トレーニングに特化した情報設計
- 誤差・回答時間・成長推移の可視化
- 音楽アプリらしい少しの美意識
- 静かで知的なトーン

---

## 7. ビジュアル方針

### 7.1 ベーステーマ

初版は以下を基本とする。

- Light base を主軸
- 必要に応じて dark theme を後続で検討
- 白 / 薄いグレー / 深いグリーンを基本色とする
- 緑はアクセントで使い、塗りすぎない

### 7.2 レイアウト方針

- 1 画面 1 目的を徹底する
- 余白で整理する
- 下部操作は片手で届く位置を重視する
- スクロール前提の情報画面と、1 画面完結が望ましい訓練画面を明確に分ける

### 7.3 タイポグラフィ方針

- 数字は強く見せる
- 見出しは短く、説明文は短文化する
- 1 画面内の文字サイズ段階を絞る
- ラベルは補助、値や CTA を主役にする
- 日本語主体で統一する

### 7.4 面と影の方針

- 線より面で整理する
- カードは使うが、影は控えめ
- 角丸は大きすぎず、上品にする
- 「ぷっくり感」は避ける

---

## 8. 画面別の UI 指針

### 8.1 ホーム

目的:
- 何のアプリかすぐ分かる
- すぐ開始できる
- 最近の成長がひと目で分かる

主役:
- 2 モード導線
- 前回の設定で再開
- 学習サマリー

禁止:
- ヒーロー領域の作り込みすぎ
- 背景演出の主張
- 情報が均一で主役が見えない構成

### 8.2 トレーニング設定

目的:
- 必要な設定だけ短時間で調整して開始できる

主役:
- モード固有設定
- 基準音設定
- セッション終了条件
- 開始 CTA

禁止:
- 設定項目の羅列感
- 説明過多
- 小さすぎる 12 音ボタン

### 8.3 出題 / 回答画面

目的:
- 基準音 → 問題音 → 回答の流れを最速で回す

主役:
- 再生ボタン
- 問題進行情報
- セッションスコア
- 回答 UI

ルール:
- 1 画面で完結を優先
- 余計な説明を置かない
- 回答 UI は指の届きやすさを優先
- 距離モードは上行 / 下行を明確に分ける
- 鍵盤モードは基準音の強調を中程度に留める

### 8.4 フィードバック画面

目的:
- 正誤とズレを一瞬で理解させる
- 次の問題へ気持ちよく進める

主役:
- 正解 / 不正解
- 正解内容
- 自分の回答
- 誤差
- 回答時間
- 次へ進む CTA

禁止:
- 長文講評
- 演出過多

### 8.5 セッション結果

目的:
- 成果を気持ちよく確認し、継続意欲につなげる

主役:
- セッションスコア
- 正答率
- 平均誤差
- 平均回答時間
- 再開 / 統計導線

### 8.6 統計

目的:
- 成長と苦手傾向を短時間で把握できる

主役:
- 日次推移
- 直近 10 / 30 問
- モード別の傾向
- 音程別 / 方向別の傾向

禁止:
- BI ツールのような密度
- 色数の多いグラフ
- ラベル過多

### 8.7 設定

目的:
- 学習体験を壊さずに基本設定だけを変えられる

主役:
- 音量
- 効果音
- 鍵盤ラベル表示
- 表記設定

---

## 9. コンポーネント採用方針

### 9.1 まず使うもの

- Button
- Card
- Tabs
- Switch
- Slider
- Select
- Dialog
- Sheet
- Toast
- Badge / Chip

### 9.2 ミーコピで custom 実装するもの

- 音の距離回答グリッド
- 鍵盤 UI
- 音再生ボタン群
- セッション進行ヘッダ
- 成長サマリーカード
- 誤差表示コンポーネント

### 9.3 原則

- shadcn/ui をそのまま見た目採用しない
- まず primitive / structure を借りる
- 見た目は design tokens で統一する
- custom component でも props / state / variant を明確にする

---

## 10. 初版デザイントークン

以下は初版であり、実装しながら微調整する。

### 10.1 Color

```ts
export const color = {
  bg: '#F6F7F5',
  bgSubtle: '#EEF1ED',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F5F2',
  border: '#D9DED8',
  text: '#172019',
  textMuted: '#5F6B61',
  primary: '#4E8F63',
  primaryHover: '#437C55',
  primarySoft: '#E7F1EA',
  success: '#3F8F5A',
  warning: '#B9852F',
  danger: '#B85C4C',
  chartPrimary: '#5E9D6E',
  chartSecondary: '#A9C9B1',
}
```

### 10.2 Radius

```ts
export const radius = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  full: '9999px',
}
```

### 10.3 Spacing

```ts
export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
}
```

### 10.4 Shadow

```ts
export const shadow = {
  sm: '0 1px 2px rgba(16, 24, 18, 0.05)',
  md: '0 4px 12px rgba(16, 24, 18, 0.08)',
  lg: '0 10px 24px rgba(16, 24, 18, 0.10)',
}
```

### 10.5 Typography

```ts
export const font = {
  display: {
    size: '32px',
    lineHeight: '1.15',
    weight: 700,
  },
  h1: {
    size: '24px',
    lineHeight: '1.25',
    weight: 700,
  },
  h2: {
    size: '20px',
    lineHeight: '1.3',
    weight: 700,
  },
  title: {
    size: '18px',
    lineHeight: '1.35',
    weight: 600,
  },
  body: {
    size: '15px',
    lineHeight: '1.5',
    weight: 400,
  },
  bodySm: {
    size: '13px',
    lineHeight: '1.45',
    weight: 400,
  },
  label: {
    size: '12px',
    lineHeight: '1.35',
    weight: 500,
  },
  metric: {
    size: '30px',
    lineHeight: '1.1',
    weight: 700,
  },
}
```

### 10.6 Motion

```ts
export const motion = {
  fast: '120ms',
  base: '180ms',
  slow: '260ms',
  easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
}
```

---

## 11. アクセシビリティ最小基準

- 通常テキストは WCAG AA 相当のコントラストを満たす
- タッチターゲットは原則 44px 以上
- ボタン / スイッチ / アイコンボタンは accessible name を持つ
- 色だけで状態を伝えない
- フィードバック時はテキストでも正誤を明示する
- キーボード操作可能な UI を確保する
- Toast のみで重要状態を伝えない

---

## 12. 実装ルール

### 12.1 コンポーネント構成

- `features/*/ui` に画面固有 UI を置く
- `components/ui` は汎用コンポーネントに限定する
- 表示ロジックと純粋ロジックを分離する
- score / question generation / evaluation は UI から直接持たせない

### 12.2 Server / Client 境界

- training の出題 / 再生 / 回答は client-heavy
- home / settings / result / stats は server-first
- 回答中は DB アクセスしない
- セッション結果は終了時にまとめて保存する

### 12.3 状態管理

- まずは local component state + useReducer で組む
- グローバル state 管理ライブラリは初期導入しない
- training flow は state machine 的な reducer で整理する

### 12.4 テスト対象

最低限、以下は必須。

- 出題候補生成
- 回答判定
- スコア計算
- セッション集計
- 設定変更の反映
- 主要導線の E2E smoke

---

## 13. 画像生成 AI 向けルール

### 13.1 毎回プロンプトに含めること

1. 画面の役割
2. 主役にする情報
3. 使用可能な UI 部品
4. 参照スタイル
5. 禁止事項
6. 出力形式

### 13.2 基本禁止事項

- multiple screens
- case study board
- UI presentation board
- neon
- gaming UI
- over-glow
- strong glassmorphism
- concept-art style
- overly decorative background

### 13.3 推奨する参照表現

- realistic mobile app screenshot
- premium iOS-style product UI
- calm wellness / habits / finance app
- typography-led layout
- clean white or light gray surfaces
- restrained green accent

### 13.4 出力形式ルール

- 原則 1 画面のみ
- 実アプリのスクリーンショットとして作らせる
- 多画面コラージュは禁止
- プレゼン資料風レイアウトは禁止

---

## 14. 画像生成 AI 用プロンプト雛形

```text
[画面名] をデザインしてください。

重要:
- これは UI ケーススタディではありません
- 複数画面を並べないでください
- プレゼン資料風にしないでください
- 1つのスマホ画面だけを大きく見せてください
- 実在する上質なアプリのスクリーンショットとして作ってください

## 画面の役割
[この画面の役割]

## 主役
- [主役要素 1]
- [主役要素 2]
- [主役要素 3]

## 参照スタイル
- premium iOS-style product UI
- calm wellness / habits / finance app
- typography-led layout
- clean surfaces
- restrained green accent
- not gaming

## 使用する UI の方向
- card-based layout
- moderate rounded corners
- subtle shadows
- clean spacing
- Japanese-first UI

## 避けること
- gaming UI
- neon glow
- strong glassmorphism
- decorative wave background
- multiple screens
- presentation board
- template-like UI kit look

## 出力要件
- single iPhone screen
- realistic app screenshot
- modern but natural
- beautiful but practical
```

---

## 15. 開発 AI 向け実装ガイド

AI に UI 実装を依頼する際は、以下を毎回渡す。

- 対象画面の責務
- 使用してよい既存コンポーネント
- 追加作成してよい component 名
- 受け入れ条件
- forbidden list
- 参考 token
- テスト要件

### 15.1 forbidden list 例

- 独自 UI ライブラリ追加禁止
- グローバル state 追加禁止
- 未承認の chart library 追加禁止
- inline style 多用禁止
- 文言の勝手な英語化禁止

### 15.2 accept criteria 例

- スマホ幅 390px 相当で崩れない
- 主要 CTA がファーストビュー内にある
- 読み順が自然
- typecheck / lint / test を通す
- a11y 属性が付いている

---

## 16. 初期運用ルール

### 16.1 デザインレビューの基準

レビューでは、まず以下の順で見る。

1. 役割が一目で分かるか
2. 主役が明確か
3. 読みやすいか
4. 押しやすいか
5. ミーコピらしいか
6. その後に美しさを見る

### 16.2 画像生成の止め時

以下を満たしたら画像生成での詰めは止める。

- 情報設計が妥当
- 画面の主役が明確
- 実装で直せる粒度の問題しか残っていない

それ以上は実装段階で余白・文字・コントラストを詰める。

---

## 17. 今後の更新予定

次版では以下を追加する。

- 実トークンを Tailwind / CSS Variables に落とした定義
- 主要画面の wireframe 例
- component inventory
- tone / copy guideline
- icon guideline
- chart guideline
- dark theme 方針

---

## 18. 現時点の結論

ミーコピの UI は、
「ゲーム的な派手さ」ではなく、
「毎日開きたくなる上質な習慣化トレーニングアプリ」
として設計する。

実装の主軸は Next.js + Tailwind + shadcn/ui + Radix とし、
見た目の主軸は Apple HIG 的な自然さ、
品質下限は WCAG 2.2、
実例参照は Mobbin 系、
共通言語は design tokens とする。

この方針により、画像生成、設計、実装、レビューを一貫させる。
