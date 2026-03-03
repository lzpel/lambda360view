# react-dom/client サブパス依存の除去

## 日付

2026-03-03

## 背景

lambda360view を別ライブラリの dependency に入れて Vite/Rollup でバンドルすると、実行時に以下のエラーが発生する：

```
Incompatible React versions: The "react" and "react-dom" packages must have the exact same version.
  - react:      19.3.0-canary-f93b9fd4-20251217
  - react-dom:  19.2.4
```

## 原因分析

### 直接的な原因

`dist/index.esm.js` の冒頭に以下の import が存在していた：

```js
import * as ReactDOM from 'react-dom/client';
```

下流の消費者が `external: ['react', 'react-dom', 'react/jsx-runtime']` と設定していても、Rollup の external は完全一致でしか動作しないため `react-dom/client` はマッチしない。結果、`react-dom/client` ごとバンドルに取り込まれ、ホストアプリの React とバージョンが衝突する。

### 根本的な原因

lambda360view 自身のソースコードには `react-dom/client` の import は存在しない。この import は `@react-three/drei` の `Html` コンポーネントに由来する。`Html` は内部で `ReactDOM.createRoot()` を使用しており、drei が dependency としてバンドルに取り込まれる際に `react-dom/client` への外部参照が残る。

### なぜ rollup.config.mjs の external 配列は効かなかったのか

lambda360view 側の rollup.config.mjs では `'react-dom/client'` を external 配列に含めていた。これ自体は正しく動作しており、ビルド出力で `react-dom/client` は external import として保持されていた。問題は lambda360view のビルドではなく、**下流の消費者のバンドラー設定**にあった。消費者側が `react-dom/client` を external に含めていなかったため、そちらでバンドルに取り込まれていた。

## 検討した選択肢

| 選択肢 | 内容 | 評価 |
|---|---|---|
| A. 消費者側で対応 | README に `react-dom/client` を external に追加する旨を記載 | 修正コストゼロだが不親切 |
| B. Html を使わない設計に変更 | 自前の軽量 Label コンポーネントで置き換え | 採用 |
| C. drei を peerDependencies に移動 | 消費者が drei/fiber/three を自分でインストール | ライブラリの手軽さが大幅に低下 |
| D. Rollup output.paths で書き換え | `react-dom/client` → `react-dom` にリマップ | `createRoot` が `react-dom` 本体にないため不可 |

### SDF テキスト（drei の Text コンポーネント）も検討したが不採用

drei の `Text`（troika-three-text ベース）は WebGL 内で SDF レンダリングするため `react-dom/client` は不要になる。しかし以下の理由で不採用とした：

- 日本語フォントファイル（4-6MB）のバンドルまたは外部読み込みが必要
- CSS の `sans-serif` のようなジェネリックフォント指定が使えない
- 背景ボックス・角丸・影などの CSS スタイリングが使えない

## 採用した解決策

drei の `Html` コンポーネントを、DOM API だけで動く自前の `Label` コンポーネントに置き換えた。

### Html が createRoot を必要とする理由

`Html` は任意の React JSX を子要素としてレンダリングするために `ReactDOM.createRoot()` を使用する。しかし `Annotations.tsx` での使用はプレーンテキストのラベル表示のみであり、React のレンダリングパイプラインは不要だった。

### Label コンポーネントの仕組み

```
Label コンポーネント
  ├─ <group position={...}> をシーングラフに配置（親の rotation 等を継承）
  ├─ useEffect で DOM 要素を作成し canvas の親要素に追加
  ├─ useFrame で毎フレーム:
  │     getWorldPosition() → シーングラフの変換を反映したワールド座標を取得
  │     project(camera) → スクリーン座標に変換
  │     CSS transform で DOM 要素を配置
  └─ アンマウント時に DOM 要素を除去
```

### 初回実装での座標ズレ問題

最初の実装では受け取った position をそのまま `project(camera)` していたが、`Annotations` は `<group rotation={upAxisRotation}>` の子要素として配置されるため、Z-up → Y-up 等の座標変換が反映されず位置がずれた。`<group>` をシーングラフに参加させ `getWorldPosition()` でワールド座標を取得するよう修正して解決。

## 変更ファイル

- `src/components/Annotations.tsx`: drei の `Html` を自前の `Label` に置き換え

## 結果

- `dist/index.esm.js` から `import ... from 'react-dom/client'` が完全に消えた
- 下流の消費者は `external: ['react', 'react-dom', 'react/jsx-runtime']` だけで React バージョン衝突が発生しなくなった
- ラベルの見た目・挙動は従来と同等（CSS スタイリング、ブラウザフォント解決をそのまま利用）
