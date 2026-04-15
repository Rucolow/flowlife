import type { MotifFunction } from "./types";
import { sdRoundBox, sdTriangle, sdfToBrightness } from "./sdf";

/* ---------- Okonomiyaki spatulas ---------- */

/**
 * 広島お好み焼きの 2 枚のヘラ。中央で交差して置かれている。
 * 横幅 80%・高さ 70%。鉄板の上で湯気が立ち昇る。
 */
export const spatula: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  let b = 0;

  /* --- 鉄板の水平線 --- */
  const plateDist = Math.abs(y - 0.92);
  if (plateDist < 0.01) b = Math.max(b, (1 - plateDist / 0.01) * 0.55);

  /* --- ヘラ 1 (右下がり、約 -25°) --- */
  const ang1 = -0.45;
  const c1x = 0.5;
  const c1y = 0.62;
  const dx1 = x - c1x;
  const dy1 = y - c1y;
  const rx1 = dx1 * Math.cos(-ang1) - dy1 * Math.sin(-ang1);
  const ry1 = dx1 * Math.sin(-ang1) + dy1 * Math.cos(-ang1);
  // 金属部
  const metal1 = sdRoundBox(rx1, ry1, -0.07, 0, 0.18, 0.05, 0.018);
  b = Math.max(b, sdfToBrightness(metal1));
  // 先端三角
  const tip1 = sdTriangle(rx1, ry1, 0.11, -0.05, 0.11, 0.05, 0.22, 0);
  b = Math.max(b, sdfToBrightness(tip1));
  // 木の柄
  const handle1 = sdRoundBox(rx1, ry1, -0.30, 0, 0.13, 0.025, 0.014);
  b = Math.max(b, sdfToBrightness(handle1));

  /* --- ヘラ 2 (左下がり、約 +25°) --- */
  const ang2 = 0.45;
  const c2x = 0.5;
  const c2y = 0.62;
  const dx2 = x - c2x;
  const dy2 = y - c2y;
  const rx2 = dx2 * Math.cos(-ang2) - dy2 * Math.sin(-ang2);
  const ry2 = dx2 * Math.sin(-ang2) + dy2 * Math.cos(-ang2);
  const metal2 = sdRoundBox(rx2, ry2, -0.07, 0, 0.18, 0.05, 0.018);
  b = Math.max(b, sdfToBrightness(metal2));
  const tip2 = sdTriangle(rx2, ry2, 0.11, -0.05, 0.11, 0.05, 0.22, 0);
  b = Math.max(b, sdfToBrightness(tip2));
  const handle2 = sdRoundBox(rx2, ry2, -0.30, 0, 0.13, 0.025, 0.014);
  b = Math.max(b, sdfToBrightness(handle2));

  /* --- 湯気（3 本、別位相）--- */
  if (y < 0.55) {
    const streams = [
      { baseX: 0.34, phase: 0.0, width: 0.022 },
      { baseX: 0.5, phase: 1.8, width: 0.026 },
      { baseX: 0.66, phase: 3.6, width: 0.022 },
    ];
    for (const s of streams) {
      const rise = time * 0.18 + s.phase;
      const sway =
        Math.sin(y * 24 + rise * 3) * 0.025 * (1 - y) +
        Math.sin(y * 11 + rise * 2) * 0.014;
      const streamX = s.baseX + sway;
      const dist = Math.abs(x - streamX);
      if (dist < s.width) {
        const density = 0.5 + Math.sin(y * 14 - rise * 4 + s.phase) * 0.5;
        const heightFade = Math.max(0, (0.55 - y) / 0.45);
        const core = 1 - dist / s.width;
        const sb = core * density * heightFade * 0.6;
        if (sb > b) b = sb;
      }
    }
  }

  return Math.min(1, b);
};

export default spatula;
