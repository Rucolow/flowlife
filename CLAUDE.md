# Flow Life — Hiroshima Directory

## What

匿名著者によるアートプロジェクト「Flow Life」の広島旅セクション。10本の短編エッセイ + ヒーロー。ASCII文字で描かれたプロシージャルモチーフが各記事のサムネイルとして機能する。

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules or Tailwind
- **ASCII Engine**: Canvas 2D（カード用15fps） / Canvas 2D 60fps（ヒーロー用）
- **Hosting**: Vercel想定

## Project Structure

```
src/
├── app/
│   ├── hiroshima/
│   │   ├── page.tsx           # 一覧ページ（Hero + 10 cards）
│   │   └── [slug]/
│   │       └── page.tsx       # 記事ページ
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ascii/
│   │   ├── AsciiCanvas.tsx    # 共通ASCIIレンダラー
│   │   ├── motifs/            # 11個のモチーフ生成関数
│   │   │   ├── types.ts       # MotifFunction型定義
│   │   │   ├── dome.ts        # 原爆ドーム（ヒーロー）
│   │   │   ├── crane.ts       # 折り鶴
│   │   │   ├── tram.ts        # 路面電車
│   │   │   ├── torii.ts       # 厳島鳥居
│   │   │   ├── deer.ts        # 鹿
│   │   │   ├── maple.ts       # もみじ
│   │   │   ├── oyster.ts      # 牡蠣
│   │   │   ├── bridge.ts      # 橋
│   │   │   ├── flame.ts       # 平和の灯
│   │   │   ├── spatula.ts     # お好み焼きのヘラ
│   │   │   └── ferry.ts       # フェリー
│   │   └── shuffleAnimation.ts # シャッフル粒子アニメーション
│   ├── cards/
│   │   ├── ArticleCard.tsx
│   │   └── CardGrid.tsx       # グリッド + シャッフルボタン
│   ├── hero/
│   │   └── HiroshimaHero.tsx
│   ├── article/
│   │   ├── ArticleBody.tsx
│   │   └── SlowVideo.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── data/
│   └── articles.ts            # 10記事のメタデータ + ASCIIパラメータ
└── content/
    └── hiroshima/
        ├── river-at-five.mdx  # テキスト素材をここに配置
        └── ...
```

## Why

- 各モチーフを独立ファイルにする理由：1モチーフの修正が他に影響しない。Claude Codeが1ファイルずつ作業できる
- AsciiCanvas.tsxを共通化する理由：カード（15fps, no interaction）とヒーロー（60fps, mouse tracking）の差はpropsで制御。描画ロジックは同一
- content/にMDXを置く理由：テキスト・映像素材は人間が後から差し込む。コードとコンテンツの分離

## How to Verify

- `npm run dev` → localhost:3000/hiroshima で一覧表示
- `npm run build` → ビルドエラーなし
- `npm run lint` → ESLintエラーなし
- ブラウザDevTools Performance → カード15fps以下、Hero60fps維持を確認

## Key Constraints

- 映像ファイル・テキスト本文は人間が用意する。プレースホルダーを置くこと
- 日時・日付は一切表示しない（投稿日、更新日、タイムスタンプすべて禁止）
- 背景は#FAFAF8、純黒テキスト禁止
- ASCIIの文字セットは全モチーフ統一
- モチーフは外部画像不使用、完全プロシージャル生成

## Reference

- 設計詳細: `docs/hiroshima/design-spec.md`
- モチーフ実装仕様: `docs/hiroshima/motif-spec.md`
- ASCII描画エンジン仕様: `docs/hiroshima/ascii-engine.md`
