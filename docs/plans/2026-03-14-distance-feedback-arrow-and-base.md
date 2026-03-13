# 基準音表示・矢印三角・矢印線種の改善

## Goal

- 基準音のラベル・丸が画面に収まるようにする（右端で切れない）。
- 矢印先端の三角形を、矢印の長さに依存せず一定サイズにし、小さくする。
- **両方の矢印を実線にする**（現在は正解が実線・回答音が破線。両方とも実線に統一する）。

## 変更方針

### 1. 基準音が画面に収まる

- [globals.css](src/app/globals.css) の `.ui-distance-diagram__viewport` に `padding-left` と `padding-right`（例: 各 8px または 12px）を追加し、右端列（down 時の基準音）・左端列（up 時の基準音）が切れないようにする。

### 2. 矢印先端の三角を一定サイズ・小さく

- 線と三角を分離: 線は従来どおり SVG の `<line>` のみ（marker は使わない）。三角は別要素で、絶対配置・固定ピクセル（例: 6px）にする。
- [train-ui-shared.tsx](src/app/train/train-ui-shared.tsx): 各矢印から `<marker>` と `markerEnd` を削除し、代わりに arrowhead 用の要素を追加（`data-direction` / `data-tone` で向き・色を指定）。
- [globals.css](src/app/globals.css): `.ui-distance-diagram__arrow` に `position: relative`、`.ui-distance-diagram__arrowhead` を追加（固定サイズ・絶対配置・向き・色）。

### 3. 両方の矢印を実線にする

- 現在、回答音（teal）の矢印だけ [globals.css](src/app/globals.css) の `.ui-distance-diagram__arrow-line[data-tone="teal"]` で `stroke-dasharray: 7 5` が指定されている。
- **対応**: 上記の `stroke-dasharray` を削除する。正解（success）・回答音（teal）とも実線になる。

## ファイル一覧（変更想定）

| ファイル | 変更内容 |
|----------|----------|
| [src/app/train/train-ui-shared.tsx](src/app/train/train-ui-shared.tsx) | 矢印: SVG から marker 削除、線のみ。arrowhead 用要素を追加。 |
| [src/app/globals.css](src/app/globals.css) | viewport に左右 padding。arrow に position:relative。arrowhead のスタイル追加。**teal の stroke-dasharray を削除（両方実線）**。 |

## 検証

- `npm run verify`
- 基準音が右端で切れていないこと、矢印三角が一定・小型であること、**両方の矢印が実線**であることを目視確認。
