import type { MotifFunction } from "./types";

/* ---------- SDF helpers ---------- */

function sdSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thickness: number,
): number {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const denom = bax * bax + bay * bay || 1e-6;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / denom));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy) - thickness;
}

/**
 * 三角形のSDF（符号つき）。内側で負、外側で正。
 */
function sdTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): number {
  const e0x = bx - ax;
  const e0y = by - ay;
  const e1x = cx - bx;
  const e1y = cy - by;
  const e2x = ax - cx;
  const e2y = ay - cy;

  const v0x = px - ax;
  const v0y = py - ay;
  const v1x = px - bx;
  const v1y = py - by;
  const v2x = px - cx;
  const v2y = py - cy;

  const h0 = Math.max(0, Math.min(1, (v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y || 1e-6)));
  const h1 = Math.max(0, Math.min(1, (v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y || 1e-6)));
  const h2 = Math.max(0, Math.min(1, (v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y || 1e-6)));

  const p0x = v0x - e0x * h0;
  const p0y = v0y - e0y * h0;
  const p1x = v1x - e1x * h1;
  const p1y = v1y - e1y * h1;
  const p2x = v2x - e2x * h2;
  const p2y = v2y - e2y * h2;

  const d0 = p0x * p0x + p0y * p0y;
  const d1 = p1x * p1x + p1y * p1y;
  const d2 = p2x * p2x + p2y * p2y;

  const s = Math.sign(e0x * e2y - e0y * e2x);
  const sd = Math.min(
    s * (v0x * e0y - v0y * e0x),
    s * (v1x * e1y - v1y * e1x),
    s * (v2x * e2y - v2y * e2x),
  );
  return -Math.sqrt(Math.min(d0, d1, d2)) * Math.sign(sd);
}

function sdfToBrightness(d: number, edge: number, depthScale: number): number {
  if (d > edge) return 0;
  if (d > 0) return (1 - d / edge) * 0.45;
  return Math.min(0.95, 0.55 + Math.abs(d) * depthScale * 0.5);
}

/* ---------- Origami crane ---------- */

/**
 * 折り鶴を斜め上から見たシルエット。翼は上下にゆっくり羽ばたく。
 * 周期4.5秒。全体が左右にほんの少し揺れる（吊り下げ感）。
 */
export const crane: MotifFunction = (nx, ny, time) => {
  const sway = Math.sin(time * 0.4) * 0.012;
  const x = nx - sway;
  const y = ny;

  if (y < 0.22 || y > 0.78) return 0;

  // 羽ばたき位相
  const flap = Math.sin(time * ((2 * Math.PI) / 4.5));
  const wingY = 0.52 + flap * 0.06;
  const wingOpen = 1 + flap * 0.3; // 翼の広がり係数

  // --- 胴体（菱形）---
  const bodyCX = 0.5;
  const bodyCY = 0.52 + flap * 0.012;
  const ddx = x - bodyCX;
  const ddy = y - bodyCY;
  // 菱形: |x|/a + |y|/b < 1
  const diamond = Math.abs(ddx) / 0.07 + Math.abs(ddy) / 0.045 - 1;
  const body = diamond * Math.min(0.07, 0.045);

  // --- 頭と首 ---
  const neck = sdSegment(x, y, 0.56, 0.48, 0.66, 0.42, 0.008);
  const headTri = sdTriangle(x, y, 0.63, 0.4, 0.72, 0.38, 0.66, 0.44);

  // --- 尾 ---
  const tail = sdTriangle(x, y, 0.43, 0.5, 0.28, 0.6, 0.4, 0.55);

  // --- 左翼 ---
  const lwTipX = 0.22;
  const lwTipY = wingY - 0.22 * wingOpen;
  const leftWing = sdTriangle(
    x,
    y,
    0.5,
    wingY,
    lwTipX,
    lwTipY,
    0.44,
    wingY + 0.04,
  );

  // --- 右翼 ---
  const rwTipX = 0.78;
  const rwTipY = wingY - 0.2 * wingOpen;
  const rightWing = sdTriangle(
    x,
    y,
    0.5,
    wingY,
    rwTipX,
    rwTipY,
    0.56,
    wingY + 0.04,
  );

  let d = Math.min(body, neck);
  d = Math.min(d, headTri);
  d = Math.min(d, tail);
  d = Math.min(d, leftWing);
  d = Math.min(d, rightWing);

  let brightness = sdfToBrightness(d, 0.012, 6);

  // --- 翼の折り目（内部の線）---
  if (leftWing <= 0.008 && leftWing > -0.05) {
    const fold = sdSegment(x, y, 0.5, wingY, lwTipX + 0.04, lwTipY + 0.05, 0.002);
    brightness = Math.max(brightness, sdfToBrightness(fold, 0.004, 12) * 0.55);
  }
  if (rightWing <= 0.008 && rightWing > -0.05) {
    const fold = sdSegment(x, y, 0.5, wingY, rwTipX - 0.04, rwTipY + 0.05, 0.002);
    brightness = Math.max(brightness, sdfToBrightness(fold, 0.004, 12) * 0.55);
  }

  return brightness;
};

export default crane;
