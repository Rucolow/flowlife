# 記事内スロー映像の埋め込み — 技術メモ

Flow Life Hiroshima 各記事の本文中に配置するスロー映像（`SlowVideo`）の設計・実装メモ。議論の叩き台。

---

## 1. 要件（目的ベース）

### 1.1 体験上の要件
- 読者のスクロールを中断させず、本文の流れの一部として映像が現れる
- 音声は一切使わない（自動再生/サウンドオフ前提の体験）
- 映像と本文の境界を意図的に曖昧にし、「読むこと」と「見ること」が地続きに感じられる
- ループ前提。始点と終点は読者に意識させない
- 記事ページのヒーローと同じ静けさを保つ（派手な演出・インジケーター・キャプション禁止）

### 1.2 機能要件
- 各記事に最大 2 本の映像を配置できる（本文構造: 3 段落 → 映像1 → 3 段落 → 映像2）
- 映像ごとにアスペクト比を指定できる（16/9, 21/9, 2/1 など可変）
- 映像ファイルが未配置でも記事レイアウトは崩れない（フォールバック表示）
- 画面外の映像は再生を停止し、再び画面内に戻れば再開する
- 本文幅（max 640px）より広く左右に出血する
- モバイルでもデスクトップでも同じルールで動く

### 1.3 非機能要件
- ビルド成果物は極力軽量に保つ（映像は public/ 配信、コード側に追加依存ゼロ）
- 映像追加・差し替えで React 側のコードを書き換えなくていい（データ駆動）
- CPU/GPU 負荷を抑える（映像は muted、プリロードを最小化）

---

## 2. データモデル

`src/data/articles.ts` に型を定義し、各記事オブジェクトに `videos` を持たせる。

```ts
export interface ArticleVideo {
  src: string;      // "/videos/paper-crane-1.mov" など
  aspect?: string;  // CSS aspect-ratio。既定 "16 / 9"
  ariaLabel?: string;
}

export interface ArticleData {
  slug: string;
  title: string;
  titleEn: string;
  motif: "crane" | "tram" | /* ... */ | "ferry";
  color: string;
  videos?: ArticleVideo[];
}
```

この構造を選んだ理由:
- 映像の本数も順序も記事ごとに差し替えたい → 配列
- 将来的に「映像の前後に 1 段落だけ」など構造を変える可能性もあるが、いまは ArticleBody 側の固定レイアウト（3 + video + 3 + video）で受ける
- `src` を URL 文字列として持つので、将来 CDN/S3 に移しても型変更なしで対応可能

---

## 3. レンダリングコンポーネント

### 3.1 `SlowVideo` の責務
- `src` が与えられていれば `<video>` を描画、なければプレースホルダー（グラデーション + "slow motion" ラベル）
- 画面内/外を監視して `play()` / `pause()` を切替
- アスペクト比を CSS の `aspect-ratio` で受ける（レイアウトが確定するので CLS ゼロ）
- 四辺を smoothstep でフェザー（詳細は 4.）

### 3.2 `<video>` 属性の選定

| 属性             | 値       | 理由 |
|------------------|----------|------|
| `autoPlay`       | true     | 読者の操作なしで再生開始 |
| `muted`          | true     | モバイル含むブラウザ自動再生ポリシーを満たすための必須条件 |
| `loop`           | true     | 長さを意識させないため |
| `playsInline`    | true     | iOS Safari でフルスクリーン化されないようにする |
| `preload`        | metadata | 最初のペイントを速くするため、バイト列の本体はビューポート接近時にロード |
| `controls`       | （なし） | 操作 UI を出さない。読者はスクロールするだけ |
| `poster`         | （なし） | 読み込み中は wrapper 背景色が透ける設計 |

### 3.3 `IntersectionObserver` による再生制御

```ts
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }
  },
  { threshold: 0.25 }
);
io.observe(wrap);
```

- `threshold: 0.25` — 映像の 25% 以上が可視になった時点で再生開始
- `play()` は Promise。何らかのポリシー違反（autoplay ブロック等）で reject する場合があるため `.catch(() => {})` で黙殺
- `pause()` は常に安全に呼べる
- コンポーネントの `useEffect` の cleanup で `io.disconnect()`

### 3.4 ArticleBody との結線
```tsx
<SlowVideo
  src={videos?.[0]?.src}
  aspect={videos?.[0]?.aspect ?? "16 / 9"}
/>
```
`videos` 配列が無い/足りないときに fallback 表示に自然に落ちるよう optional chaining のみで処理。

---

## 4. エッジフェザー（映像と本文の境界を曖昧にする）

### 4.1 初期案: シンプルな線形マスク
```css
mask-image: linear-gradient(
  to bottom,
  transparent 0%,
  black 14%,
  black 86%,
  transparent 100%
);
```
**問題**: 14% と 86% で `d(alpha)/dt` が不連続 → 人間の視覚（Mach band）がそこを「線」として認識する。フェードの始まりがくっきり見えてダサい。

### 4.2 採用案: smoothstep で多段サンプリング
S 字カーブ `f(t) = t² × (3 − 2t)` をサンプリングした 7 段グラデーション。両端で傾き 0 になるので折れ目が生まれない。

```css
linear-gradient(
  to bottom,
  rgba(0,0,0,0)     0%,
  rgba(0,0,0,0.028) 4%,
  rgba(0,0,0,0.104) 8%,
  rgba(0,0,0,0.352) 14%,
  rgba(0,0,0,0.648) 18%,
  rgba(0,0,0,0.896) 22%,
  rgba(0,0,0,1)     28%,
  /* ... プラトー ... */
  rgba(0,0,0,0)     100%
);
```

### 4.3 2 軸の合成
縦方向フェード（段落と接するため強め: 0→28% / 72→100%）と、横方向フェード（出血を活かすため控えめ: 0→17% / 83→100%）を重ねる:

```css
mask-image: <vertical gradient>, <horizontal gradient>;
mask-composite: intersect;      /* 両方不透明な領域だけを残す */
-webkit-mask-composite: source-in; /* Safari/WebKit 用 */
```

`intersect` (標準) と `source-in` (WebKit) は別名だが結果は同じ「両マスクの積集合」。

### 4.4 なぜ `filter: blur()` ではなくマスクか
- `filter: blur()` は映像本体にも及んでしまい、縁だけをぼかすには擬似要素を重ねる必要があり複雑
- CSS マスクは GPU 合成フレンドリーで 60fps 維持
- 透明度ベースなのでページ背景 `#FAFAF8` にそのまま溶け込む
- 再利用しやすい（パラメータは 2 つのフェード幅だけ）

---

## 5. ファイル形式・コーデック・ホスティング

### 5.1 現状
- `.mov` (H.264 中身) を `public/videos/` に配置
- Next.js の静的アセット配信経由で `/videos/xxx.mov` として提供
- Chrome/Safari の `<video>` タグは H.264 コンテナが `.mov` でも再生可能（アドレスバー直打ちだと Chrome はダウンロードさせるが、`<video>` 経由なら再生される）

### 5.2 将来推奨する最終形
**コンテナは `.mp4`、コーデックは H.264 baseline/main + yuv420p**:
```
ffmpeg -i in.mov \
  -c:v libx264 -crf 22 -preset slow \
  -pix_fmt yuv420p \
  -an \
  -movflags +faststart \
  out.mp4
```
理由:
- `.mp4` は全ブラウザ・全 OS・全 SNS プレビューで最も安定
- `yuv420p` は WebKit の古いパスでも再生可能な色空間
- `+faststart` はメタデータを先頭に寄せるので `preload="metadata"` の往復が 1 回で済む

### 5.3 ファイル命名規則
```
public/videos/<slug>-1.<ext>
public/videos/<slug>-2.<ext>
```
- 記事 slug と末尾番号で映像を推測できる
- `articles.ts` の定義と照合しやすい
- 将来 3 本目・4 本目を入れるなら `-3`, `-4`

### 5.4 git 管理方針（未決、要議論）
3 案:
1. **`.gitignore` で除外 + CDN 配信**（本番推奨）  
   Cloudflare R2 / S3 / Vercel Blob にアップ → `src` を絶対 URL 化。リポジトリを軽く保ち、デプロイも速い。
2. **`.gitignore` で除外 + ローカルのみ保持**  
   当面の開発には十分。本番公開時に CDN に移行。
3. **git LFS で管理**  
   GitHub に置きつつリポジトリ本体は汚さない。1 GB 無料枠、超過で有料。

現状は未決のまま動画を手元配置しているため、合計サイズが大きくなったら 1 に倒すのが筋。

---

## 6. パフォーマンス

### 6.1 初期ロード
- `<video preload="metadata">` で冒頭のメタデータだけ取得 → TTI への影響を最小化
- 本体データは `IntersectionObserver` が `play()` を呼ぶまでストリーミングされない（ブラウザの最適化に任せる）

### 6.2 同時再生数
ArticleBody は最大 2 本。ヒーローは静的 ASCII で動画ではないため、同時デコーダー使用数は最大 2。モバイル Safari でも問題なし。

### 6.3 CPU
- 映像デコードは GPU
- マスクは CSS 合成で無視できるコスト
- ASCII キャンバス（ヒーロー）と同時に走っても 60fps 維持可能（実測）

### 6.4 モバイルデータ節約
- `muted` `loop` なので音声データは読まない
- `preload="metadata"` はファイルの最初の数百バイトのみ
- 画面外では `pause()` で帯域消費ゼロ（ブラウザ実装依存だが一般に停止）

---

## 7. アクセシビリティ

- 映像は装飾的な役割（本文を補完するムード素材）なので、音声なし・字幕なしを許容
- `aria-label` 属性を任意で渡せる（記事側で `ariaLabel: "夕暮れの太田川"` のように指定可能）
- `reduced-motion` の読者に対しては、現状は配慮なし。以下は検討事項:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .video { display: none; }
    .wrap { /* 静止画に差し替え、あるいはプレースホルダー表示 */ }
  }
  ```

---

## 8. 既知の制約・トレードオフ

| トピック | 現状 | 将来の選択肢 |
|---|---|---|
| `.mov` 配信 | Chrome は再生、アドレスバー直叩きはダウンロード | `.mp4` 統一 |
| `mask-composite` | 全モダンブラウザ対応、IE/古 Edge は非対応（今は無視） | SVG マスクへ移行すれば古環境対応可能 |
| autoplay ブロック | `muted` 必須、ユーザーが設定で muted を切っても映像は音声なしのまま動作 | 明示的な play ボタンの追加は検討しない方針 |
| `preload="metadata"` | モバイルで metadata も読まない実装あり (iOS) | 必要になれば `preload="auto"` に上げる |
| 映像サイズ | 現状 `.mov` で重い可能性 | `-crf 22 -preset slow` の `.mp4` にすれば 30-50% 削減見込み |
| `mask-image` のぼけ方が個体差あり | display の物理 DPI でサブピクセル精度が変わる | 許容。マスクの帯幅を十分広く取って影響を最小化 |

---

## 9. 議論したいポイント

1. **ホスティング方針**（セクション 5.4）を 1/2/3 のどれに倒すか
2. **映像の尺**（ループ長）の目安。5-10 秒か、15-30 秒か
3. **アスペクト比の使い分け**: 現状 `16/9` と `21/9` を交互にしているが、記事ごとの意図を反映すべきか、全記事で固定すべきか
4. **動画の前後に「息継ぎ」があってもいいか**: 段落間マージンを映像前後だけ広げるなど
5. **`prefers-reduced-motion` 対応**の優先度
6. **ポスター画像**を付けるか（読み込み待ちの体験をどうするか）
7. **記事本文データの外部化**: 現在はプレースホルダー6段落をソースに持っているが、将来 MDX/CMS 化するならここも一緒に議論

---

## 10. 参考: 関連ファイル

- `src/data/articles.ts` — ArticleVideo 型と各記事のメタデータ
- `src/components/article/SlowVideo.tsx` — `<video>` 描画 + IntersectionObserver
- `src/components/article/SlowVideo.module.css` — マスクによるエッジフェザー
- `src/components/article/ArticleBody.tsx` — 3段落 + 映像 + 3段落 + 映像のレイアウト
- `src/app/hiroshima/[slug]/page.tsx` — `videos={article.videos}` で配列を流し込む
- `public/videos/` — 配信対象の映像ファイル
- `public/videos/README.md` — 命名規則とエンコードレシピ
