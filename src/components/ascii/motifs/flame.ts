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
  if (d > 0) return (1 - d / edge) * 0.45;
  return Math.min(0.95, 0.55 + Math.abs(d) * depthScale * 0.5);
}

/* ---------- Peace Flame ---------- */

/**
 * 平和の灯。台座の上で揺れる炎。
 *
 * - 炎: 中央の雫形。先端が尖り、根元が広がる
 * - 炎の芯: 中心の最明部（白に近い）
 * - 台座: 下部の水平矩形
 * - 光の拡散: 炎の周囲に薄く広がる
 *
 * 動きは11個の中で最も有機的。周期2-3秒。
 */
export const flame: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  if (y < 0.15 || y > 0.9) return 0;

  // 炎全体の揺れ（周期2.5秒）
  const sway1 = Math.sin(time * 2.5) * 0.015;
  const sway2 = Math.sin(time * 3.7 + 1.2) * 0.008;
  const flameCX = 0.5 + sway1 + sway2;

  /* --- 台座 --- */
  const baseTopY = 0.72;
  const base = sdBox(x, y, 0.5, 0.78, 0.2, 0.04);
  let brightness = sdfToBrightness(base, 0.012, 5.5);

  /* --- 炎の雫形 --- */
  if (y < baseTopY + 0.01) {
    // 炎の中心軸（下から上へ、揺れながら）
    const flameBaseY = baseTopY - 0.005;
    const flameTopY = 0.28;
    // 高さに応じた正規化(0=根元, 1=先端)
    const t = (flameBaseY - y) / (flameBaseY - flameTopY);
    if (t >= 0 && t <= 1) {
      // 炎の輪郭：下で太く、上で尖る。さらに時間で微かに形が変わる
      const width =
        0.08 * (1 - t) * (0.9 + t * 0.2) +
        Math.sin(time * 4 + t * 12) * 0.006 * (1 - t * 0.6) +
        Math.sin(time * 6.1 - t * 8) * 0.003;
      // 上半では軸が揺れる
      const axisOffset =
        Math.sin(time * 3.2 + t * 4) * 0.015 * t +
        Math.sin(time * 5 + t * 7) * 0.008 * t;
      const axisX = flameCX + axisOffset;
      const dist = Math.abs(x - axisX);
      if (dist < width) {
        // 炎本体の明度。中心ほど濃く、先端ほど薄く揺らぐ
        const core = 1 - dist / width;
        const tipFade = Math.pow(1 - t, 0.45);
        const flicker = 0.9 + Math.sin(time * 8 + t * 6) * 0.1;
        const flameB = Math.min(
          1,
          (0.4 + core * 0.55) * tipFade * flicker,
        );
        brightness = Math.max(brightness, flameB);

        // --- 炎の芯（中心の最明部）---
        const coreY = baseTopY - 0.12 + Math.sin(time * 2.8) * 0.02;
        const coreDist = Math.sqrt(
          (x - flameCX) ** 2 * 4 + (y - coreY) ** 2 * 9,
        );
        if (coreDist < 0.06) {
          const coreB = (1 - coreDist / 0.06) * 0.95;
          brightness = Math.max(brightness, coreB);
        }
      }

      // --- 光の拡散（炎の周囲のハロー）---
      if (dist < width * 2.2 && dist >= width) {
        const halo =
          (1 - (dist - width) / (width * 1.2)) *
          0.18 *
          (1 - t * 0.6) *
          (0.9 + Math.sin(time * 3) * 0.1);
        brightness = Math.max(brightness, Math.max(0, halo));
      }
    }
  }

  return Math.min(1, brightness);
};

export default flame;
