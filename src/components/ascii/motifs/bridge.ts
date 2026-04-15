import type { MotifFunction } from "./types";
import { sdBox, sdfToBrightness } from "./sdf";

/* ---------- Arch bridge ---------- */

/**
 * 太田川に架かるアーチ橋を横から見た図。
 *
 * 構成:
 * - アーチ: 半円形
 * - 路面: アーチの上を走る水平線
 * - 欄干: 路面の上の低い柵
 * - 橋脚: アーチ両端と中央の柱
 * - 水面: 橋の下。左から右へ流れる
 *
 * 動き: 水流は周期12秒。水面反射がゆらぐ。
 */
export const bridge: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  // 水面レベル
  const waterY = 0.7;
  // 路面レベル
  const roadY = 0.45;
  // アーチ中心（路面下、半円の直径の中心）
  const archCX = 0.5;
  const archCY = roadY;
  const archRout = 0.28; // 外半径
  const archRin = 0.24; // 内半径

  let brightness = 0;

  /* --- アーチ本体（半円リング、路面下のみ）--- */
  if (y >= roadY - 0.01 && y <= waterY + 0.01) {
    const dx = x - archCX;
    const dy = y - archCY;
    const r = Math.sqrt(dx * dx + dy * dy);
    // 下半分のみ（dy >= 0）
    if (dy >= -0.01 && r <= archRout + 0.015 && r >= archRin - 0.015) {
      const outer = r - archRout; // <0 内側
      const inner = archRin - r;  // <0 外側
      const ringD = Math.max(outer, inner);
      brightness = Math.max(brightness, sdfToBrightness(ringD, 0.012, 7));
    }
  }

  /* --- 路面（水平棒）--- */
  const road = sdBox(x, y, 0.5, roadY, 0.42, 0.015);
  brightness = Math.max(brightness, sdfToBrightness(road, 0.012, 6.5));

  /* --- 欄干（低い柵と、等間隔の柱）--- */
  const railTop = sdBox(x, y, 0.5, roadY - 0.04, 0.4, 0.004);
  brightness = Math.max(brightness, sdfToBrightness(railTop, 0.005, 10));
  // 欄干の柱（8本）
  if (x > 0.1 && x < 0.9 && y > roadY - 0.045 && y < roadY - 0.005) {
    const COLS = 8;
    const gap = 0.8 / (COLS - 1);
    let minPost = 1;
    for (let i = 0; i < COLS; i++) {
      const pcx = 0.1 + gap * i;
      const pd = sdBox(x, y, pcx, roadY - 0.025, 0.0025, 0.02);
      if (pd < minPost) minPost = pd;
    }
    brightness = Math.max(brightness, sdfToBrightness(minPost, 0.006, 10));
  }

  /* --- 橋脚（アーチ両端と中央）--- */
  // 左右の橋脚（水面直下まで）
  const leftPier = sdBox(x, y, archCX - archRout, (roadY + waterY) / 2 + 0.02, 0.028, (waterY - roadY) / 2 + 0.04);
  const rightPier = sdBox(x, y, archCX + archRout, (roadY + waterY) / 2 + 0.02, 0.028, (waterY - roadY) / 2 + 0.04);
  brightness = Math.max(brightness, sdfToBrightness(leftPier, 0.012, 5.5));
  brightness = Math.max(brightness, sdfToBrightness(rightPier, 0.012, 5.5));

  /* --- 水面 --- */
  if (y > waterY - 0.01) {
    // 流れ（左→右、周期12秒）
    const flow = time * 0.08;
    const wave =
      Math.sin(x * 20 - flow * 10) * 0.006 +
      Math.sin(x * 33 + flow * 6) * 0.003 +
      Math.sin(x * 9 + flow * 4) * 0.004;
    // 水面ライン
    const surfaceDist = Math.abs(y - waterY - wave);
    if (surfaceDist < 0.008) {
      brightness = Math.max(brightness, (1 - surfaceDist / 0.008) * 0.5);
    }

    // 水面に映る橋の反射（アーチを反転）
    const below = y - waterY;
    if (below > 0 && below < 0.18) {
      const distort = Math.sin(x * 18 - flow * 8) * 0.01 * below * 3;
      const my2 = waterY - below + distort;
      // アーチの反射
      const rdx = x - archCX;
      const rdy = my2 - archCY;
      const rr = Math.sqrt(rdx * rdx + rdy * rdy);
      if (rdy >= 0 && rr <= archRout + 0.01 && rr >= archRin - 0.01) {
        const outer = rr - archRout;
        const inner = archRin - rr;
        const ringD = Math.max(outer, inner);
        const fade = 1 - below / 0.18;
        const refB = sdfToBrightness(ringD, 0.018, 3.5) * fade * 0.3;
        brightness = Math.max(brightness, refB);
      }
      // 路面の反射（細い横線）
      const roadRefl = Math.abs(my2 - roadY);
      if (roadRefl < 0.01) {
        const fade = 1 - below / 0.18;
        brightness = Math.max(brightness, (1 - roadRefl / 0.01) * 0.18 * fade);
      }
    }
  }

  return brightness;
};

export default bridge;
