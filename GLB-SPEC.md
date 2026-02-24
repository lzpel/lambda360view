# lambda360view GLB 仕様書

> 本ドキュメントは lambda360view が受け取る GLB ファイルの仕様を定義する。
> サーバー側の GLB 生成ロジックはこの仕様に準拠すること。

---

## 1. 概要

lambda360view は GLB (glTF 2.0 binary) の `ArrayBuffer` を `model` prop として受け取り、Three.js / React Three Fiber でレンダリングする。

```
<Lambda360View model={arrayBuffer} ... />
```

---

## 2. GLB 全体構造

```
GLB ファイル
├─ JSON chunk  (通常の glTF 2.0 標準フィールド)
│   ├─ asset, scene, nodes, meshes, materials ...
│   ├─ buffers[], bufferViews[]
│   ├─ accessors[]
│   │   ├─ [0] indices   ← mesh primitive から参照される (通常)
│   │   ├─ [1] positions ← mesh primitive から参照される (通常)
│   │   ├─ [2] normals   ← mesh primitive から参照される (通常)
│   │   └─ [N] edges     ← どの primitive も参照しない "orphan accessor" ★
│   └─ extras: { "edgeAccessor": N }  ← orphan の index を記録 ★
└─ BIN chunk
    └─ indices | positions | normals | edge_positions  (バイナリ連続配置)
```

`accessors[]` と `extras` はどちらも glTF 2.0 の標準フィールド。
特殊なのは「どの mesh primitive にも参照されない accessor（orphan）」をエッジデータに流用している点。

---

## 3. メッシュ部分

通常の glTF メッシュとして格納する。インデックス付きレンダリング (indexed rendering) を使用すること。

| accessor index | 用途      | bufferView target    | componentType | type   |
|---------------|-----------|----------------------|---------------|--------|
| 0             | indices   | 34963 (ELEMENT_ARRAY) | 5123 (U16)   | SCALAR |
| 1             | positions | 34962 (ARRAY_BUFFER) | 5126 (F32)   | VEC3   |
| 2             | normals   | 34962 (ARRAY_BUFFER) | 5126 (F32)   | VEC3   |

> de-indexed (全頂点展開) は BIN chunk を著しく肥大化させるため禁止。

---

## 3.5 マテリアルとライティング

### フラット表示（推奨）: `KHR_materials_unlit`

ライトの影響を受けず、どの方向から見ても `baseColorFactor` がそのまま表示される。
Three.js GLTFLoader は `KHR_materials_unlit` を検出すると自動的に `MeshBasicMaterial` を使用する。

```json
{
  "extensionsUsed": ["KHR_materials_unlit"],
  "materials": [
    {
      "extensions": {
        "KHR_materials_unlit": {}
      },
      "pbrMetallicRoughness": {
        "baseColorFactor": [0.91, 0.69, 0.14, 1.0],
        "metallicFactor": 0,
        "roughnessFactor": 1
      },
      "alphaMode": "OPAQUE",
      "doubleSided": true
    }
  ]
}
```

### ライティングあり: 通常の `pbrMetallicRoughness`

`KHR_materials_unlit` を省略した場合、Three.js は `MeshStandardMaterial` を使用し、
ビューワーが配置した ambientLight / directionalLight の影響を受けて陰影がつく。

### マテリアルなし（非推奨）

mesh primitive に `material` 参照がない場合、Three.js は白い `MeshStandardMaterial` をデフォルト適用する。
意図しない陰影が生じるため、必ずマテリアルを明示すること。

---

## 4. エッジデータ仕様（最重要）

### 4.1 格納方式

エッジデータは **orphan accessor** (どの mesh primitive にも参照されない accessor) としてBIN chunkに格納する。

```
accessors[N]: {
  "bufferView": <bufferViewIndex>,
  "componentType": 5126,   // FLOAT (f32)
  "count": <頂点数>,
  "type": "VEC3"
}
```

ルートの `extras` に accessor インデックスを記録する:

```json
{
  "extras": {
    "edgeAccessor": N
  }
}
```

`N` は accessors 配列内のインデックス番号（0始まり）。

### 4.2 accessor index の割り当て例

メッシュが1つの場合の典型的な配置:

| index | 用途          | 備考             |
|-------|---------------|------------------|
| 0     | indices       | mesh primitive 参照 |
| 1     | positions     | mesh primitive 参照 |
| 2     | normals       | mesh primitive 参照 |
| 3     | edge_positions | **orphan**（参照なし）|

メッシュ数が増える場合はインデックスが後ろにずれる。`edgeAccessor` の値を正しく設定すること。

### 4.3 エッジデータのバイナリ形式

- **componentType**: `5126` (FLOAT / f32)
- **type**: `VEC3`
- **1頂点のサイズ**: 12 bytes (float32 × 3)
- **格納順序**: LINE_SEGMENTS の端点ペア

```
Buffer layout:
  [x0, y0, z0]  ← 線分1の始点 (index 0)
  [x1, y1, z1]  ← 線分1の終点 (index 1)
  [x2, y2, z2]  ← 線分2の始点 (index 2)
  [x3, y3, z3]  ← 線分2の終点 (index 3)
  ...
```

- **偶数インデックス** = 線分の始点
- **奇数インデックス** = 線分の終点
- `count` = 頂点数（線分数 × 2）。必ず偶数であること。

### 4.4 座標系

- メッシュと同一の座標系で記録する
- `upAxis` prop による回転補正はビューワー側が行うため、GLB内ではモデル固有の座標系のままでよい

---

## 5. ビューワー側の読み取りロジック

```typescript
loader.parse(model, '', (gltf) => {
    const edgeAccessorIndex = gltf.userData?.edgeAccessor;
    if (edgeAccessorIndex !== undefined) {
        gltf.parser.getDependency('accessor', edgeAccessorIndex)
            .then((attr: THREE.BufferAttribute) => {
                // attr.array は Float32Array (count × 3 要素)
                setEdgePositions(attr.array as Float32Array);
            });
    }
});
```

- `gltf.userData` は glTF ルートの `extras` を Three.js が自動マップしたもの
- `gltf.parser.getDependency('accessor', index)` で orphan accessor を取得する

エッジの描画:

```typescript
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
const lineSegments = new THREE.LineSegments(geometry, lineMaterial);
scene.add(lineSegments);
```

---

## 6. ファイルサイズの目安

| accessor 構成 | BIN chunk サイズ（頂点数に依存） |
|--------------|-------------------------------|
| indices (U16 SCALAR) | count × 2 bytes |
| positions (F32 VEC3) | count × 12 bytes |
| normals (F32 VEC3)   | count × 12 bytes |
| edges (F32 VEC3)     | count × 12 bytes |

エッジを JSON extras に格納した場合と比べ、BIN chunk 格納では **float 1個あたり約10バイト → 4バイト** に削減される（参考: 49MB → 15MB の実績）。

---

## 7. extras への追加フィールド（将来拡張用）

ルートの `extras` オブジェクトに追加フィールドを置くことができる。現在定義済みのキー:

| キー          | 型     | 説明                        |
|---------------|--------|-----------------------------|
| `edgeAccessor` | number | エッジ accessor のインデックス |

他のフィールドはビューワーが無視する。

---

## 8. 禁止事項

| 禁止                         | 理由                                      |
|-----------------------------|-------------------------------------------|
| `node.extras.edges` に float 配列を JSON 格納 | JSON chunk が膨大になる（旧方式） |
| de-indexed メッシュ           | BIN chunk が不必要に肥大化する             |
| `edgeAccessor` を node レベルに記録 | ビューワーはルート `gltf.userData` のみ参照する |

---

## 9. 動作確認チェックリスト

- [ ] GLB を `ArrayBuffer` としてフェッチし `model` prop に渡せる
- [ ] エッジなしの GLB でもクラッシュしない（`edgeAccessor` が存在しない場合は無視）
- [ ] `edgePositions` が `Float32Array` として取得できる
- [ ] エッジが `THREE.LineSegments` として正しく描画される
- [ ] `showEdges={false}` でエッジが非表示になる
- [ ] `edgeColor` の変更がリアルタイムに反映される
