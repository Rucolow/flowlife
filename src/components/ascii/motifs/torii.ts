import type { MotifFunction } from "./types";

function sdBox(
  px: number,
  py: number,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
): number {
  const dx = Math.abs(px - cx) - hw;
  const dy = Math.abs(py - cy) - hh;
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(dx, dy), 0);
}

function sdfToBrightness(d: number, edge: number, depthScale: number): number {
  if (d > edge) return 0;
  if (d > 0) return (1 - d / edge) * 0.3;
  return Math.min(1, 0.3 + Math.abs(d) * depthScale * 0.7);
}

/* ---------- Itsukushima Torii ---------- */

/**
 * 海に立つ大鳥居。水面に半分映る。
 *
 * - 笠木: 上部の反った横木
 * - 島木: 笠木下の直線横木
 * - 柱: 2本
 * - 貫: 中央の横木
 * - 水面: 鳥居下半に波打つ
 * - 反射: 水面下に鳥居の揺れた反映
 *
 * 動き: 波は周期3-4秒、潮は周期20秒。鳥居本体は静止。
 */
export const torii: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  // 潮位（ゆっくり上下、周期20秒）
  const tide = Math.sin(time * ((2 * Math.PI) / 20)) * 0.012;
  const waterY = 0.58 + tide;

  // --- 鳥居本体（waterY より上の部分）---
  let structure = 1;

  // 笠木（上部、両端が跳ね上がる反り）
  const kasagiCenterY = 0.2;
  const kasagiCurve = Math.abs(x - 0.5) > 0.32 ? (Math.abs(x - 0.5) - 0.32) * 0.25 : 0;
  const kasagi = sdBox(x, y + kasagiCurve, 0.5, kasagiCenterY, 0.42, 0.025);
  structure = Math.min(structure, kasagi);

  // 島木（笠木の下）
  const shimagi = sdBox(x, y, 0.5, 0.26, 0.36, 0.015);
  structure = Math.min(structure, shimagi);

  // 左柱
  const leftPillar = sdBox(x, y, 0.3, 0.44, 0.028, 0.22);
  // 右柱
  const rightPillar = sdBox(x, y, 0.7, 0.44, 0.028, 0.22);
  structure = Math.min(structure, leftPillar);
  structure = Math.min(structure, rightPillar);

  // 貫（柱の間の横木）
  const nuki = sdBox(x, y, 0.5, 0.36, 0.22, 0.012);
  structure = Math.min(structure, nuki);

  // 水面より上だけ描画（水面から少し潜るのはOK）
  let brightness = 0;
  if (y < waterY + 0.01) {
    brightness = sdfToBrightness(structure, 0.012, 6.5);
  }

  // --- 水面の波 ---
  if (y > waterY - 0.01 && y < waterY + 0.25) {
    // 水面からの距離
    const below = y - waterY;
    // 波の高さ: sin の重ね合わせ（周期3-4秒）
    const wave =
      Math.sin(x * 22 + time * 1.8) * 0.008 +
      Math.sin(x * 41 - time * 1.3) * 0.004 +
      Math.sin(x * 9 + time * 0.7) * 0.006;
    // 水面ライン
    const surfaceDist = Math.abs(below - wave);
    if (surfaceDist < 0.006) {
      const lineB = (1 - surfaceDist / 0.006) * 0.45;
      brightness = Math.max(brightness, lineB);
    }

    // --- 反射（水面下、鳥居の垂直ミラー）---
    if (below > 0 && below < 0.22) {
      // 反射座標（y反転）+ 波による歪み
      const distortion = Math.sin(x * 18 + time * 1.6) * 0.008 * below * 4;
      const mirrorY = waterY - below + distortion;

      let mirror = 1;
      const mKasagiCurve =
        Math.abs(x - 0.5) > 0.32 ? (Math.abs(x - 0.5) - 0.32) * 0.25 : 0;
      mirror = Math.min(
        mirror,
        sdBox(x, mirrorY + mKasagiCurve, 0.5, kasagiCenterY, 0.42, 0.025),
      );
      mirror = Math.min(mirror, sdBox(x, mirrorY, 0.5, 0.26, 0.36, 0.015));
      mirror = Math.min(mirror, sdBox(x, mirrorY, 0.3, 0.44, 0.028, 0.22));
      mirror = Math.min(mirror, sdBox(x, mirrorY, 0.7, 0.44, 0.028, 0.22));
      mirror = Math.min(mirror, sdBox(x, mirrorY, 0.5, 0.36, 0.22, 0.012));

      // 深さに応じて反射を減衰
      const fade = Math.max(0, 1 - below / 0.22);
      const refB = sdfToBrightness(mirror, 0.018, 4) * fade * 0.35;
      brightness = Math.max(brightness, refB);
    }
  }

  return brightness;
};

export default torii;
