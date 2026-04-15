import type { MotifFunction } from "./types";
import { sdBox, sdRoundBox, sdTriangle, sdfToBrightness } from "./sdf";

/* ---------- Miyajima ferry ---------- */

/**
 * 宮島行きフェリーを横から見たシルエット。横幅 75%。
 *
 * 構成:
 *   船体（台形 + 丸底）  : 中心 (0.5, 0.6)、横半幅 0.36、高さ 0.10
 *   船室（角丸矩形）     : 船体上、6 つの窓
 *   煙突 + 煙             : 船室上
 *   水面 / 船首波 / 航跡 : y > 0.74
 */
export const ferry: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  const rock = Math.sin(time * ((2 * Math.PI) / 4.5)) * 0.012;
  const pitch = Math.sin(time * ((2 * Math.PI) / 4.5) + 0.6) * 0.025;

  const waterY = 0.74;
  let b = 0;

  /* --- 船体 --- */
  const hullCX = 0.5 + rock;
  const hullCY = 0.6;
  const hdx = x - hullCX;
  const hdy = y - hullCY + hdx * pitch;

  // 上の矩形部分
  const hullTop = sdBox(hdx, hdy, 0, 0, 0.36, 0.05);
  // 丸底（楕円）
  const hullBottomNorm = Math.sqrt((hdx / 0.32) ** 2 + ((hdy - 0.025) / 0.075) ** 2);
  const hullBottom = (hullBottomNorm - 1) * Math.min(0.32, 0.075);
  // 船首・船尾のテーパー
  const hullLeft = sdTriangle(hdx, hdy, -0.36, -0.05, -0.32, 0.05, -0.28, -0.05);
  const hullRight = sdTriangle(hdx, hdy, 0.36, -0.05, 0.32, 0.05, 0.28, -0.05);
  const hull = Math.min(hullTop, Math.min(hullBottom, Math.min(hullLeft, hullRight)));
  b = Math.max(b, sdfToBrightness(hull));

  /* --- 船室 --- */
  const cabinCX = hullCX - 0.02;
  const cabinCY = hullCY - 0.13;
  const cdx = x - cabinCX;
  const cdy = y - cabinCY + (x - hullCX) * pitch;
  const cabin = sdRoundBox(cdx, cdy, 0, 0, 0.24, 0.07, 0.012);
  b = Math.max(b, sdfToBrightness(cabin));

  /* --- 窓（6 枚）--- */
  if (cabin <= 0) {
    const WIN = 6;
    const winSpan = 0.36;
    for (let i = 0; i < WIN; i++) {
      const wcx = -winSpan / 2 + (winSpan / (WIN - 1)) * i;
      const wd = sdBox(cdx, cdy, wcx, 0, 0.018, 0.028);
      if (wd < 0) {
        // 窓は車体より明るく
        b = Math.min(b, 0.3);
      }
    }
  }

  /* --- 煙突 --- */
  const stackCX = hullCX + 0.10;
  const stackCY = hullCY - 0.23;
  const stack = sdBox(x, y, stackCX, stackCY, 0.018, 0.04);
  b = Math.max(b, sdfToBrightness(stack));

  /* --- 煙 --- */
  if (y < stackCY - 0.03 && y > 0.08) {
    const tRise = time * 0.25;
    const smokeX = stackCX + Math.sin(y * 18 + tRise) * 0.025 * (stackCY - y) * 2;
    const dist = Math.abs(x - smokeX);
    if (dist < 0.016) {
      const core = 1 - dist / 0.016;
      const fade = Math.max(0, (stackCY - y) / 0.4);
      const density = 0.6 + Math.sin(y * 18 - tRise * 3) * 0.4;
      const sb = core * fade * density * 0.45;
      if (sb > b) b = sb;
    }
  }

  /* --- 水面 + 船首波 --- */
  if (y > waterY - 0.01) {
    const bowWaveX = hullCX + 0.36;
    const bowDist = Math.abs(x - bowWaveX);
    const bowHeight = Math.max(0, 0.022 - bowDist * 0.1) * Math.max(0, 0.06 - bowDist) * 60;
    const wave =
      Math.sin(x * 24 + time * 2) * 0.006 +
      Math.sin(x * 42 - time * 1.4) * 0.004;
    const surfaceY = waterY + wave - bowHeight;
    const surfaceDist = Math.abs(y - surfaceY);
    if (surfaceDist < 0.010) b = Math.max(b, (1 - surfaceDist / 0.010) * 0.55);

    // 航跡
    const wakeStartX = hullCX - 0.36;
    const wakeDx = wakeStartX - x;
    if (wakeDx > 0 && wakeDx < 0.40) {
      const spread = wakeDx * 0.5;
      const offsetY = y - waterY;
      const band1 = Math.abs(offsetY - spread * 0.15);
      const band2 = Math.abs(offsetY + spread * 0.15);
      const bandAnim = Math.sin(wakeDx * 30 - time * 3) * 0.003;
      const wake = Math.min(band1, band2) + bandAnim;
      if (wake < 0.008) {
        const fade = 1 - wakeDx / 0.40;
        const wb = (1 - wake / 0.008) * fade * 0.45;
        if (wb > b) b = wb;
      }
    }
  }

  return Math.min(1, b);
};

export default ferry;
