# ASCII Engine Spec — 描画エンジン仕様

## AsciiCanvas コンポーネント

### Props

```typescript
interface AsciiCanvasProps {
  motif: MotifFunction;       // モチーフ生成関数
  color: string;              // ベースカラー (hex, e.g. "#6B7B8A")
  mode: "card" | "hero";      // 描画モード
  className?: string;
  style?: React.CSSProperties;
}
```

### モード別の挙動

| 項目 | card | hero |
|------|------|------|
| FPS | 15 | 60 |
| マウス追従 | なし (mx=0.5, my=0.5固定) | あり |
| IntersectionObserver | あり (threshold 0.05) | あり (threshold 0.1) |
| canvas解像度 | 表示サイズの50% | 表示サイズの75% |
| cellSize | 7px (モバイル: 9px) | 9px (モバイル: 11px) |

### 描画パイプライン

```
1. canvasサイズからcols/rowsを算出
   cols = floor(canvasWidth / cellSize)
   rows = floor(canvasHeight / (cellSize * 1.6))

2. 各セル(x, y)に対してmotif関数を呼び出し、明度(0-1)を取得

3. Bayerディザリングを適用
   threshold = (bayer4x4[y%4][x%4] / 16 - 0.5) * 0.25
   brightness = clamp(brightness + threshold, 0, 1)

4. 明度から文字インデックスを算出
   charIndex = floor(brightness * (CHARS.length - 1))
   charIndex == 0 なら描画スキップ

5. 明度からアルファと色の濃度を算出
   alpha = 0.1 + brightness * 0.9
   colorIntensity = brightness^2  (二乗で非線形にする)

6. 文字を描画
   色: baseColorをcolorIntensityでスケール
   フォント: "Courier New", monospace
   描画: ctx.fillText(char, x * cw + cw/2, y * ch + ch/2)
```

### 色の算出

ライト背景なので、暗い部分ほど文字が濃くなる方向。

```typescript
function computeColor(baseHex: string, brightness: number): string {
  const r = parseInt(baseHex.slice(1,3), 16);
  const g = parseInt(baseHex.slice(3,5), 16);
  const b = parseInt(baseHex.slice(5,7), 16);

  // brightnessが高い = 形の密な部分 = 色を濃くする
  const intensity = brightness * brightness;
  const alpha = 0.1 + brightness * 0.9;

  return `rgba(${r},${g},${b},${alpha * intensity})`;
}
```

注意: 背景が白(#FAFAF8)なので、alphaが低い文字は自然に薄く見える。
純黒は使わない。各モチーフの固有色で統一する。

### ディザリング

Bayer 4x4マトリクスのみ使用。

```typescript
const BAYER4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

function bayerDither(brightness: number, x: number, y: number): number {
  const idx = (y % 4) * 4 + (x % 4);
  const threshold = (BAYER4[idx] / 16 - 0.5) * 0.25;
  return Math.max(0, Math.min(1, brightness + threshold));
}
```

### 文字セット

```typescript
const CHARS = " .,:;+*?%S#@";
// index: 0  1 2 3 4 5 6 7 8 9 10 11
// 0 = 空白（描画しない）
// 11 = 最も密な文字（形の中心部）
```

全モチーフでこの文字セットを共有する。

---

## シャッフルアニメーション

### データ構造

```typescript
interface Particle {
  char: string;
  x: number;          // ページ座標
  y: number;
  targetX: number;    // 最終目標座標
  targetY: number;
  vx: number;         // 速度
  vy: number;
  rotation: number;   // 回転角度
  vr: number;         // 回転速度
  color: string;
  alpha: number;
  phase: "scatter" | "gather";
}
```

### フロー

```
1. [準備] 全カードのcanvasから現在描画中の文字とその座標を抽出
   - 各カードのcanvasのページ座標 + カード内の文字座標 → ページ絶対座標
   - 空白文字は除外
   - Particle配列を生成

2. [散乱] 0.6秒
   - 全カードのcanvasを visibility: hidden に
   - ページ全体を覆うoverlay canvas (position: fixed, inset: 0) を生成
   - 各Particleにランダムな速度ベクトルを割り当て
     vx: (Math.random() - 0.5) * 800
     vy: (Math.random() - 0.5) * 600
     vr: (Math.random() - 0.5) * 4
   - フレームごとに位置を更新、アルファを徐々に減衰

3. [入れ替え] 散乱フェーズの終盤で:
   - カードの順序をシャッフル（Fisher-Yates）
   - 新しいカード配置から、各文字の目標座標を算出
   - 各Particleにtargetを設定

4. [再集合] 0.8秒
   - 各Particleが現在位置からtargetへ向かって移動
   - イージング: easeOutCubic
   - 到着順は中心から外側へ（中心付近の文字が先に到着）
   - アルファは徐々に回復

5. [完了]
   - overlay canvasを除去
   - カードのcanvasを新しい順序で visibility: visible に
   - 通常のモチーフアニメーションが再開
```

### パフォーマンス考慮

- 粒子数の上限: 2000個程度。超える場合はランダムに間引く
- overlay canvasの解像度: デバイスピクセル比は1固定（retina不要）
- 散乱→再集合の間にrequestAnimationFrameで描画

---

## 記事データ構造

```typescript
interface ArticleData {
  slug: string;
  title: string;        // 日本語タイトル
  titleEn: string;      // 英語タイトル
  motif: string;        // モチーフ関数名 ("crane" | "tram" | ...)
  color: string;        // ASCIIカラー (hex)
}

const ARTICLES: ArticleData[] = [
  { slug: "paper-crane",     title: "千羽鶴の重さ",     titleEn: "Paper Crane Weight",    motif: "crane",   color: "#B5564A" },
  { slug: "tram-silence",    title: "路面電車の沈黙",   titleEn: "Tram Silence",           motif: "tram",    color: "#4A6B5E" },
  { slug: "floating-torii",  title: "浮かぶ鳥居",       titleEn: "Floating Torii",         motif: "torii",   color: "#C4563A" },
  { slug: "deer-island",     title: "鹿のいる島",       titleEn: "Deer Island",            motif: "deer",    color: "#8B7355" },
  { slug: "autumn-leaf",     title: "もみじの時間",     titleEn: "Maple Time",             motif: "maple",   color: "#C4443A" },
  { slug: "oyster-morning",  title: "牡蠣筏の朝",       titleEn: "Oyster Raft Morning",    motif: "oyster",  color: "#7A8B8E" },
  { slug: "bridge-count",    title: "橋を数える",       titleEn: "Bridge Count",           motif: "bridge",  color: "#5A6A7A" },
  { slug: "eternal-flame",   title: "消えない灯",       titleEn: "Eternal Flame",          motif: "flame",   color: "#D4A245" },
  { slug: "iron-spatula",    title: "鉄板の上の手",     titleEn: "Okonomiyaki Hands",      motif: "spatula", color: "#6B5A45" },
  { slug: "island-ferry",    title: "島へのフェリー",   titleEn: "Island Ferry",           motif: "ferry",   color: "#4A6580" },
];

// ヒーロー（一覧ページ専用）
const HERO_CONFIG = {
  motif: "dome",
  color: "#6B7B8A",
};
```
