import type { MotifFunction } from "./types";
import { sdBox, sdfToBrightness } from "./sdf";

/* ---------- Arch bridge ---------- */

/**
 * 太田川に架かる石造アーチ橋を横から見た図。横幅 75%。
 *
 * 構成:
 *   アーチ環   : 外半径 0.36 / 内半径 0.30、半円
 *   路面       : 中心 (0.5, 0.40)、横幅 0.85
 *   欄干       : 路面の上、柱が等間隔
 *   橋脚       : アーチ両端の柱
 *   水面 + 反射 : y > 0.74
 */
export const bridge: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  const roadY = 0.40;
  const waterY = 0.74;
  const archCX = 0.5;
  const archCY = roadY;
  const archRout = 0.36;
  const archRin = 0.30;

  let b = 0;

  /* --- アーチ環（半円）--- */
  if (y >= roadY - 0.01 && y <= waterY + 0.02) {
    const dx = x - archCX;
    const dy = y - archCY;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (dy >= -0.01 && r <= archRout + 0.02 && r >= archRin - 0.02) {
      const outer = r - archRout;
      const inner = archRin - r;
      const ringD = Math.max(outer, inner);
      b = Math.max(b, sdfToBrightness(ringD));
    }
  }

  /* --- 路面 --- */
  const road = sdBox(x, y, 0.5, roadY, 0.42, 0.022);
  b = Math.max(b, sdfToBrightness(road));

  /* --- 欄干（細い水平線 + 柱）--- */
  const railTop = sdBox(x, y, 0.5, roadY - 0.06, 0.40, 0.006);
  b = Math.max(b, sdfToBrightness(railTop));
  if (x > 0.10 && x < 0.90 && y > roadY - 0.065 && y < roadY - 0.005) {
    const COLS = 9;
    const gap = 0.80 / (COLS - 1);
    let minPost = 1;
    for (let i = 0; i < COLS; i++) {
      const pcx = 0.10 + gap * i;
      const pd = sdBox(x, y, pcx, roadY - 0.035, 0.005, 0.030);
      if (pd < minPost) minPost = pd;
    }
    b = Math.max(b, sdfToBrightness(minPost));
  }

  /* --- 橋脚（アーチの両端を水面まで）--- */
  const pierTopY = (roadY + waterY) / 2 + 0.04;
  const pierHH = (waterY - roadY) / 2 + 0.06;
  const leftPier = sdBox(x, y, archCX - archRout, pierTopY, 0.035, pierHH);
  const rightPier = sdBox(x, y, archCX + archRout, pierTopY, 0.035, pierHH);
  b = Math.max(b, sdfToBrightness(leftPier));
  b = Math.max(b, sdfToBrightness(rightPier));

  /* --- 水面 --- */
  if (y > waterY - 0.01) {
    const flow = time * 0.08;
    const wave =
      Math.sin(x * 20 - flow * 10) * 0.007 +
      Math.sin(x * 33 + flow * 6) * 0.004 +
      Math.sin(x * 9 + flow * 4) * 0.005;
    const surfaceDist = Math.abs(y - waterY - wave);
    if (surfaceDist < 0.008) b = Math.max(b, 0.55);

    // 反射
    const below = y - waterY;
    if (below > 0 && below < 0.2) {
      const distort = Math.sin(x * 18 - flow * 8) * 0.012 * below * 3;
      const my2 = waterY - below + distort;
      const rdx = x - archCX;
      const rdy = my2 - archCY;
      const rr = Math.sqrt(rdx * rdx + rdy * rdy);
      if (rdy >= 0 && rr <= archRout + 0.01 && rr >= archRin - 0.01) {
        const ringD = Math.max(rr - archRout, archRin - rr);
        const fade = 1 - below / 0.2;
        const rb = sdfToBrightness(ringD);
        if (rb > 0) b = Math.max(b, rb * fade * 0.4);
      }
    }
  }

  return b;
};

export default bridge;
