import { BAYER4, CHARS, type MotifFunction } from "./motifs/types";
import { getMotif } from "./motifs";
import type { ArticleData } from "@/data/articles";

/* ---------- Particle ---------- */

interface Particle {
  char: string;
  /** ページ座標（現在位置） */
  x: number;
  y: number;
  /** 最終目標ページ座標 */
  targetX: number;
  targetY: number;
  /** 散乱開始位置 — gather フェーズで lerp 元として使う */
  scatterOriginX: number;
  scatterOriginY: number;
  /** 速度（ページ座標 / 秒） */
  vx: number;
  vy: number;
  /** 回転角度（rad） */
  rotation: number;
  vr: number;
  /** rgba 文字列の baseColor 部分（例: "107,123,138"） */
  colorRGB: string;
  /** 文字サイズ（px） */
  fontSize: number;
  /** 0-1 の基礎アルファ（明度由来） */
  baseAlpha: number;
}

export interface CardSlot {
  /** ページ内のバウンディング矩形 */
  rect: DOMRect;
  /** このスロットが現在表示している記事 */
  article: ArticleData;
  /** 記事の一意識別子（slug） */
  key: string;
}

/* ---------- helpers ---------- */

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function isMobile(): boolean {
  return window.matchMedia("(max-width: 560px)").matches;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function fisherYates<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 1つのカードから粒子を抽出する。AsciiCanvas と同じ明度→文字→アルファ変換を使う。
 * ページ絶対座標の x/y を返す。
 */
function sampleCardParticles(
  motif: MotifFunction,
  color: string,
  rect: DOMRect,
  time: number,
): Array<{
  char: string;
  pageX: number;
  pageY: number;
  alpha: number;
  fontSize: number;
  colorRGB: string;
}> {
  const out: Array<{
    char: string;
    pageX: number;
    pageY: number;
    alpha: number;
    fontSize: number;
    colorRGB: string;
  }> = [];

  const cellSize = isMobile() ? 7 : 5; // card mode — matches AsciiCanvas MODE_CONFIG
  const cw = cellSize;
  const ch = cellSize * 1.6;
  const cols = Math.max(1, Math.floor(rect.width / cw));
  const rows = Math.max(1, Math.floor(rect.height / ch));
  const [r, g, b] = parseHex(color);
  const colorRGB = `${r},${g},${b}`;
  const fontSize = Math.max(8, cellSize * 1.35);

  for (let yi = 0; yi < rows; yi++) {
    const ny = (yi + 0.5) / rows;
    const bayerRow = (yi & 3) * 4;
    for (let xi = 0; xi < cols; xi++) {
      const nx = (xi + 0.5) / cols;
      let br = motif(nx, ny, time, 0.5, 0.5);
      if (br <= 0) continue;
      const threshold = (BAYER4[bayerRow + (xi & 3)] / 16 - 0.5) * 0.25;
      br += threshold;
      if (br <= 0) continue;
      if (br > 1) br = 1;
      const charIdx = Math.floor(br * (CHARS.length - 1));
      if (charIdx <= 0) continue;
      const char = CHARS[charIdx];
      // Keep in sync with AsciiCanvas: alpha = 0.35 + br * 0.6.
      const alpha = 0.35 + br * 0.6;
      out.push({
        char,
        pageX: rect.left + xi * cw + cw / 2,
        pageY: rect.top + yi * ch + ch / 2,
        alpha,
        fontSize,
        colorRGB,
      });
    }
  }
  return out;
}

/* ---------- main ---------- */

const MAX_PARTICLES = 2000;
const SCATTER_MS = 600;
const GATHER_MS = 800;

export interface ShuffleOptions {
  /** 各スロットに対応する DOM 要素 + 現在のセル順の記事データ */
  slots: CardSlot[];
  /** シャッフル後の新しいスロット→記事割り当て。slots と同じ長さ。 */
  newAssignment: ArticleData[];
  /** スキャッター開始直前に呼ばれる（カードを visibility:hidden にする等）。 */
  onBeforeScatter?: () => void;
  /** 散乱終了後、新しい順序を state に反映するために呼ばれる。
   *  React 側でこの時点で articles の順序を newAssignment に入れ替える。 */
  onReorder?: () => void;
  /** 完了後に呼ばれる（カードを表示に戻す等）。 */
  onComplete?: () => void;
}

/** 与えられた配列を Fisher-Yates でシャッフルして返す。 */
export function shuffleArray<T>(arr: T[]): T[] {
  return fisherYates(arr);
}

/**
 * カード粒子シャッフルアニメーションを実行する。完了時に resolve する Promise を返す。
 *
 * フロー:
 *  1. 現在の order で各カードから粒子を抽出（ページ座標）
 *  2. 新しい order での各記事の位置を計算（target 座標）
 *  3. overlay canvas を document に追加
 *  4. onBeforeScatter（カード visibility:hidden 推奨）
 *  5. 散乱フェーズ（SCATTER_MS）: ランダム速度で飛び散り、アルファ減衰
 *  6. onReorder: 呼び出し側で配列順序を更新
 *  7. 再集合フェーズ（GATHER_MS）: easeOutCubic で target へ、アルファ回復
 *  8. overlay 削除、onComplete
 */
export function runShuffle({
  slots,
  newAssignment,
  onBeforeScatter,
  onReorder,
  onComplete,
}: ShuffleOptions): Promise<void> {
  return new Promise<void>((resolve) => {
    const time = performance.now() / 1000;

    // slug -> new slot index
    const newSlotFor = new Map<string, number>();
    newAssignment.forEach((a, i) => newSlotFor.set(a.slug, i));

    // 1. extract particles from each slot, annotate with target
    let collected: Particle[] = [];
    for (const slot of slots) {
      const motif = getMotif(slot.article.motif);
      const samples = sampleCardParticles(
        motif,
        slot.article.color,
        slot.rect,
        time,
      );
      // このスロットの記事（slot.article.slug）が新しい order で
      // どの位置に移動するかを参照する
      const destSlotIdx = newSlotFor.get(slot.article.slug);
      if (destSlotIdx === undefined) continue;
      const destRect = slots[destSlotIdx].rect;
      for (const s of samples) {
        const localX = s.pageX - slot.rect.left;
        const localY = s.pageY - slot.rect.top;
        collected.push({
          char: s.char,
          x: s.pageX,
          y: s.pageY,
          scatterOriginX: s.pageX,
          scatterOriginY: s.pageY,
          targetX: destRect.left + localX,
          targetY: destRect.top + localY,
          vx: (Math.random() - 0.5) * 800,
          vy: (Math.random() - 0.5) * 600,
          rotation: 0,
          vr: (Math.random() - 0.5) * 4,
          colorRGB: s.colorRGB,
          fontSize: s.fontSize,
          baseAlpha: s.alpha,
        });
      }
    }

    // 粒子数の上限
    if (collected.length > MAX_PARTICLES) {
      const keep = MAX_PARTICLES / collected.length;
      collected = collected.filter(() => Math.random() < keep);
    }

    // 2. overlay canvas
    const overlay = document.createElement("canvas");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "1000";
    overlay.width = window.innerWidth;
    overlay.height = window.innerHeight;
    document.body.appendChild(overlay);

    const ctx = overlay.getContext("2d");
    if (!ctx) {
      overlay.remove();
      resolve();
      return;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    onBeforeScatter?.();

    // 3. animation
    const startScatter = performance.now();
    const scatterEnd = startScatter + SCATTER_MS;
    let reorderTriggered = false;

    function renderFrame() {
      const now = performance.now();
      ctx!.clearRect(0, 0, overlay.width, overlay.height);

      if (now < scatterEnd) {
        // SCATTER PHASE
        const t = (now - startScatter) / SCATTER_MS;
        const dt = 1 / 60;
        for (const p of collected) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.vr * dt;
          const alpha = p.baseAlpha * (1 - t);
          drawParticle(ctx!, p, alpha);
          // 現在位置を scatter 末端位置として記録（gather の開始点）
          p.scatterOriginX = p.x;
          p.scatterOriginY = p.y;
        }
        requestAnimationFrame(renderFrame);
      } else {
        // --- reorder trigger (once, right at scatter end) ---
        if (!reorderTriggered) {
          reorderTriggered = true;
          onReorder?.();
        }
        // GATHER PHASE
        const gElapsed = now - scatterEnd;
        if (gElapsed < GATHER_MS) {
          const t = gElapsed / GATHER_MS;
          const e = easeOutCubic(t);
          for (const p of collected) {
            p.x = p.scatterOriginX + (p.targetX - p.scatterOriginX) * e;
            p.y = p.scatterOriginY + (p.targetY - p.scatterOriginY) * e;
            p.rotation *= 1 - e * 0.9;
            const alpha = p.baseAlpha * e;
            drawParticle(ctx!, p, alpha);
          }
          requestAnimationFrame(renderFrame);
        } else {
          // done
          overlay.remove();
          onComplete?.();
          resolve();
        }
      }
    }

    requestAnimationFrame(renderFrame);
  });
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  alpha: number,
) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.rotation !== 0) ctx.rotate(p.rotation);
  ctx.font = `${p.fontSize}px "Courier New", monospace`;
  ctx.fillStyle = `rgba(${p.colorRGB},${alpha.toFixed(3)})`;
  ctx.fillText(p.char, 0, 0);
  ctx.restore();
}
