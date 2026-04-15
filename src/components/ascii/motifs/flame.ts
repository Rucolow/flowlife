import type { MotifFunction } from "./types";
import { sdBox, sdfToBrightness } from "./sdf";

/* ---------- Peace Flame ---------- */

/**
 * 平和の灯。台座の上で揺れる炎。横幅 30%・縦幅 60%（縦長）。
 *
 * 構成:
 *   炎本体（雫形）  : 中心 x=0.5、根元 y=0.75、先端 y=0.18
 *   芯（最明部）    : 炎中央
 *   ハロー          : 炎の周囲
 *   台座            : y=0.82 周辺の水平な土台
 */
export const flame: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  if (y < 0.10 || y > 0.92) return 0;

  // 揺れ
  const sway1 = Math.sin(time * 2.5) * 0.018;
  const sway2 = Math.sin(time * 3.7 + 1.2) * 0.010;
  const flameCX = 0.5 + sway1 + sway2;

  let b = 0;

  /* --- 台座 --- */
  const base = sdBox(x, y, 0.5, 0.85, 0.25, 0.04);
  b = Math.max(b, sdfToBrightness(base));

  /* --- 炎の雫形 --- */
  const baseTopY = 0.78;
  const tipY = 0.18;
  if (y < baseTopY) {
    const t = (baseTopY - y) / (baseTopY - tipY); // 0 = 根元, 1 = 先端
    if (t >= 0 && t <= 1) {
      // 幅: 根元で広く、先端で尖る
      const widthBase = 0.13 * (1 - t * 0.95) * (1 - Math.pow(t, 6) * 0.5);
      const widthFlicker =
        Math.sin(time * 4 + t * 12) * 0.01 * (1 - t * 0.6) +
        Math.sin(time * 6.1 - t * 8) * 0.005;
      const width = Math.max(0.005, widthBase + widthFlicker);
      // 軸の揺れ
      const axisOffset =
        Math.sin(time * 3.2 + t * 4) * 0.022 * t +
        Math.sin(time * 5 + t * 7) * 0.012 * t;
      const axisX = flameCX + axisOffset;
      const dist = Math.abs(x - axisX);
      if (dist < width) {
        // 炎本体: 中心ほど濃く、先端で薄く揺らぐ
        const core = 1 - dist / width;
        const tipFade = Math.pow(1 - t, 0.4);
        const flicker = 0.92 + Math.sin(time * 8 + t * 6) * 0.08;
        const flameB = Math.min(0.95, (0.55 + core * 0.4) * tipFade * flicker + 0.1);
        if (flameB > b) b = flameB;

        // 芯（中央の最明部）
        const coreY = baseTopY - 0.18 + Math.sin(time * 2.8) * 0.025;
        const coreDist = Math.sqrt(
          (x - flameCX) ** 2 * 4 + (y - coreY) ** 2 * 9,
        );
        if (coreDist < 0.07) b = Math.max(b, 0.95);
      }
      // ハロー
      else if (dist < width * 2.0) {
        const halo =
          (1 - (dist - width) / (width * 1.0)) *
          0.32 *
          (1 - t * 0.5) *
          (0.9 + Math.sin(time * 3) * 0.1);
        if (halo > 0.1) b = Math.max(b, halo);
      }
    }
  }

  return Math.min(1, b);
};

export default flame;
