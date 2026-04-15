import type { MotifFunction } from "./types";
import { sdfToBrightness } from "./sdf";

/* ---------- Oyster ---------- */

/**
 * 牡蠣の殻。横幅 70%・縦幅 55% を占める大きな不規則楕円。
 * 上下殻が周期 9s で開閉する。
 */
export const oyster: MotifFunction = (nx, ny, time) => {
  const cx = 0.5;
  const cy = 0.52;
  const dx = nx - cx;
  const dy = ny - cy;

  if (Math.abs(dx) > 0.45 || Math.abs(dy) > 0.35) return 0;

  const ang = Math.atan2(dy, dx);
  const breath = Math.sin(time * ((2 * Math.PI) / 9)) * 0.018;
  const irreg =
    Math.sin(ang * 3 + 0.7) * 0.04 +
    Math.sin(ang * 7 + 2.1) * 0.018 +
    Math.sin(ang * 5 - 1.4) * 0.012;

  // 殻の半径
  const baseRx = 0.36;
  const baseRy = 0.27;

  // 開閉
  const openness = (Math.sin(time * ((2 * Math.PI) / 9)) + 1) * 0.5;
  const gap = openness * 0.018;

  const isUpper = dy < 0;
  const yShift = isUpper ? -gap : gap;
  const dyShifted = dy - yShift;

  const rx = baseRx + irreg + breath;
  const ry = baseRy + irreg * 0.7 + breath * 0.8;
  const norm = Math.sqrt((dx / rx) ** 2 + (dyShifted / ry) ** 2);
  const shellD = (norm - 1) * Math.min(rx, ry);

  let b = sdfToBrightness(shellD);

  if (shellD <= 0) {
    /* --- 合わせ目（中央の暗い水平線）+ 内側の覗き --- */
    if (Math.abs(dy) < gap + 0.008) {
      // 中が見える: 明度を 0.3 (薄く) にして殻と区別
      b = Math.max(b, 0.3);
    } else {
      // 合わせ目線
      const seamDist = Math.abs(dy - (isUpper ? -gap : gap));
      if (seamDist < 0.01) b = Math.max(b, 0.85);
    }

    /* --- 同心円状の成長線（ひだ）--- */
    const distFromCenter = Math.sqrt(dx * dx + dyShifted * dyShifted);
    const tNorm = distFromCenter / Math.max(rx, ry);
    // 等間隔の縞（最も外側の3-4本を強調）
    const ridgeWave = Math.sin(tNorm * 28 + Math.sin(time * 0.3) * 0.5);
    if (ridgeWave > 0.7) {
      // 縞が濃い場所では明度を一段上げる
      b = Math.min(0.95, b + 0.1);
    }
  }

  return b;
};

export default oyster;
