# Design Spec — Flow Life Hiroshima

## 設計思想

このサイトは「展示」である。10本のエッセイが等価に並び、読者がどこから入っても成立する。日時は存在しない。各記事はASCII文字で描かれた広島のモチーフをサムネイルとして持ち、そのモチーフは静止画ではなく、ゆっくりと生きているように動く。

## 色彩設計

### ベースカラー

```
背景:            #FAFAF8  （温かみのあるオフホワイト）
本文:            #2D2B28  （温灰チャコール）
見出し:          #1A1816  （微かに赤みを含む暗色）
メタ情報/UI:     #9B9590  （温灰）
ボーダー:        #E8E4E0  （温ベージュ線）
ホバー背景:      #F4F2EF  （微かに暗くなるだけ）
```

### ASCIIモチーフカラー（記事ごとに1色系統）

各モチーフは1色の濃淡で表現する。明度で文字の密度・サイズが変わる。

```
原爆ドーム（Hero）:   #6B7B8A  鉄灰
折り鶴:               #B5564A  朱
路面電車:             #4A6B5E  深緑
厳島鳥居:             #C4563A  丹色
鹿:                   #8B7355  鹿毛色
もみじ:               #C4443A  紅
牡蠣:                 #7A8B8E  海灰
橋:                   #5A6A7A  鉄青
平和の灯:             #D4A245  灯火色
お好み焼きのヘラ:     #6B5A45  焦茶
フェリー:             #4A6580  海紺
```

文字の濃度は明度に応じて段階的に変わる:
- 形の中心（明度高）: 文字が密、アルファ0.8〜1.0
- 形のエッジ（明度低）: 文字が疎、アルファ0.15〜0.3
- 形の外側: 文字なし（背景色が見える）

---

## ページ構成

### 1. 一覧ページ `/hiroshima/`

#### ヒーローセクション

- 高さ: 65vh
- 内容: 原爆ドームのASCIIモチーフ、マウス追従あり（マウス位置に応じて文字の揺れ・密度が微かに変化）
- タイトル配置: 左下
  - "Hiroshima" — DM Mono, 9px, letter-spacing 0.5em, uppercase, #9B9590
  - "広島" — Cormorant Garamond, clamp(32px, 5vw, 56px), 300weight, #1A1816
  - サブテキスト — Cormorant Garamond italic, clamp(14px, 1.8vw, 18px), 300weight, #9B9590
- ヒーロー下端: 背景色(#FAFAF8)へのグラデーションフェード

#### シャッフルボタン

- カードグリッドの直上、右寄せ
- スタイル: テキストリンク的。装飾的なボタンではない
- ラベル: "Shuffle" — DM Mono, 10px, letter-spacing 0.15em, #9B9590
- ホバー: #2D2B28に変化
- 機能: 後述のシャッフルアニメーションを発火

#### カードグリッド

- 最大幅: 1200px, 中央寄せ
- 3列均一, gap: 24px
- パディング: 0 clamp(24px, 5vw, 64px)
- タブレット(≤900px): 2列
- スマホ(≤560px): 1列

#### カード

- アスペクト比: 16:10
- 背景: #FAFAF8（ページ背景と同じ。カードの「枠」はASCIIモチーフの存在自体で示す）
- ボーダー: なし。L字コーナーマークなし
- モチーフ: カード全体をキャンバスとして、中央にモチーフが描画される。モチーフは常に動いている
- テキスト:
  - カード下部に日本語タイトル: Cormorant Garamond, clamp(16px, 1.8vw, 20px), 400weight, #1A1816
  - その下に英語タイトル: DM Mono, 9px, letter-spacing 0.12em, uppercase, #9B9590
- ホバー:
  - カード全体が translateY(-3px), transition 0.4s cubic-bezier(0.16, 1, 0.3, 1)
  - テキストの色がわずかに濃くなる
- 番号なし（序列を作らない）

#### フッター

- 極限まで控えめ
- 左: "Flow Life" — Cormorant Garamond, 12px, 300weight, letter-spacing 0.3em, #C8C4C0
- 右: "Hiroshima" — DM Mono, 9px, #D8D4D0
- 上線: 1px solid #E8E4E0

---

### 2. 記事ページ `/hiroshima/[slug]`

#### 固定ヘッダー

- 高さ: 42px
- 背景: rgba(250,250,248,0.9) + backdrop-filter: blur(10px)
- 下線: 1px solid #E8E4E0
- 左: "← Hiroshima" — DM Mono, 10px, letter-spacing 0.15em, #9B9590, クリックで一覧に戻る
- 右: "Flow Life" — Cormorant Garamond, 12px, 300weight, letter-spacing 0.25em, #C8C4C0

#### ヒーローセクション

- 高さ: 55vh
- 内容: カードと同一パラメータのASCIIモチーフ（同じ色・同じ形・同じ動き）をフルワイドで表示
- マウス追従あり
- タイトル配置: 左下
  - 日本語タイトル: Cormorant Garamond, clamp(28px, 4.5vw, 48px), 300weight, #1A1816
  - 英語タイトル: Cormorant Garamond italic, clamp(13px, 1.5vw, 16px), 300weight, #9B9590
- 下端: 背景色へのグラデーションフェード

#### 本文エリア

- 最大幅: 640px, 中央寄せ
- 上パディング: clamp(48px, 8vh, 80px)
- 下パディング: clamp(80px, 12vh, 120px)

#### テキストの組み

```
フォント:             "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif
ウェイト:             300-400
サイズ:               clamp(14px, 1.6vw, 16px)
行間:                 line-height: 2.0
段落間:               margin-bottom: clamp(24px, 3.5vh, 36px)
字間:                 letter-spacing: 0.04em
色:                   #2D2B28 （alpha不使用、背景がライトなので直接色指定）
揃え:                 text-align: justify
OpenType:             font-feature-settings: "palt"
段落冒頭:             字下げなし
```

#### スロー映像の配置

- 本文幅(640px)より広く出血: 左右に calc(-1 * clamp(12px, 3vw, 32px)) のnegative margin
- アスペクト比: 映像ごとに異なる（16:9, 21:9, 2:1 など、content/のデータで指定）
- 上下の余白: clamp(40px, 6vh, 64px)（通常段落間の約1.5-2倍）
- videoタグ属性: autoplay, muted, loop, playsinline
- CSS filter: brightness(0.95) — ライト背景なのでわずかに抑える程度
- 角: 丸めない。矩形
- キャプション: なし
- 映像の後のテキスト開始: 余白を空けてから再開

#### 記事末尾

- 縦線: 1px solid #E8E4E0, height 40px, 中央
- テキスト: "return to Hiroshima" — Cormorant Garamond italic, 13px, 300weight, #9B9590
- ホバー: #2D2B28に変化
- 次の記事への導線は置かない。一覧に戻して選び直させる

---

## タイポグラフィ

### 書体構成（3書体）

```
表示用:    Cormorant Garamond (300, 400, italic)  — タイトル・見出し・フッター
UI用:      DM Mono (300, 400)                      — ラベル・ナビ・メタ情報
本文:      Noto Serif JP (300, 400)                 — エッセイ本文
```

### サイズ階層

```
ヒーロータイトル:     clamp(32px, 5vw, 56px)
記事ヒーロータイトル: clamp(28px, 4.5vw, 48px)
カードタイトル:       clamp(16px, 1.8vw, 20px)
本文:                 clamp(14px, 1.6vw, 16px)
UIラベル/メタ:        9-10px, letter-spacing 0.12-0.5em
フッター:             ≤12px
```

---

## インタラクション

### ヒーロー（一覧・記事共通）
- マウス位置に応じて文字の微かな揺れ・密度変化
- タッチデバイスではタッチ位置に追従

### カード
- ホバー: translateY(-3px), 0.4s ease-out
- タップ/クリック: 記事ページへ遷移

### シャッフルアニメーション（詳細）

1. ボタン押下
2. 全カードのASCII文字が個別粒子として飛び散る
   - 各文字が現在のcanvas上の座標を持っている
   - 文字ごとにランダムな速度ベクトル(vx, vy)を割り当て
   - 回転も加える(vr)
   - 文字は元の色を保持したまま飛ぶ
3. 散乱フェーズ: 0.6秒
   - 文字がcanvas外へ向かって飛び出す（重力なし）
   - アルファが徐々に下がる
4. カード順序をランダムに入れ替え
5. 再集合フェーズ: 0.8秒
   - 新しいカード位置に向かって文字が集まってくる
   - easeOutCubicで減速しながら到着
   - 到着後にモチーフの通常アニメーションが再開
6. 全体の所要時間: 約1.8秒

技術実装:
- 全カードのcanvasを一時的に非表示にし、ページ全体を覆う一枚のoverlay canvasで粒子アニメーションを描画
- 粒子の初期位置 = 各カードcanvas内の文字座標をページ座標に変換
- 粒子の最終位置 = シャッフル後の各カードcanvas内の文字座標をページ座標に変換
- アニメーション完了後にoverlayを除去、各カードのcanvasを新しい順序で表示

### スクロールインジケーター（ヒーロー下端）
- 1pxの縦線、28px高、下方向にグラデーション
- スクロール開始で opacity 0 に（scrollY / 200 で算出）

---

## レスポンシブ

### ブレークポイント

```
Desktop:  > 900px   — 3列グリッド
Tablet:   561-900px — 2列グリッド
Mobile:   ≤ 560px   — 1列グリッド
```

### モバイル調整
- カードのcellSizeを+2px（描画負荷軽減）
- ヒーローのcellSizeも+2px
- 本文の左右パディングを24pxに
- スロー映像のnegative marginを縮小（出血量を減らす）
- カード間のgapを16pxに

---

## パフォーマンス要件

### カード（10枚同時表示の可能性あり）
- Canvas 2D, 15fps固定（requestAnimationFrameでスロットル）
- IntersectionObserver: threshold 0.05で画面外のcanvasは描画停止
- canvasの解像度: 表示サイズの50%程度で描画し、CSSでスケールアップ（retina対応不要）

### ヒーロー
- Canvas 2D, 60fps, マウス追従
- 画面外に出たらIntersectionObserverで停止

### スロー映像
- preload="metadata" で初期ロードを軽く
- IntersectionObserverで画面内に入ったらplay、出たらpause
