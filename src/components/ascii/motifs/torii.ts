import type { MotifFunction } from "./types";
import { sdBox, sdfToBrightness } from "./sdf";

/* ---------- Itsukushima Torii ---------- */

/**
 * 海に立つ大鳥居。明確な「門」の輪郭。横幅 70%。
 *
 * レイアウト:
 *   笠木（反った上端） : x ∈ [0.13, 0.87]、中心 y=0.20
 *   島木（直線横木）   : x ∈ [0.18, 0.82]、中心 y=0.27
 *   貫（中央横木）     : x ∈ [0.22, 0.78]、中心 y=0.45
 *   左柱              : x ∈ [0.24, 0.30], y ∈ [0.22, 0.72]
 *   右柱              : x ∈ [0.70, 0.76], y ∈ [0.22, 0.72]
 *   水面              : y > 0.72、波 + 反射
 */
export const torii: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  // 潮位（周期20s）
  const tide = Math.sin(time * ((2 * Math.PI) / 20)) * 0.012;
  const waterY = 0.72 + tide;

  let b = 0;

  /* --- 笠木（先端反り上がり）--- */
  const kasagiCY = 0.20;
  // 反り（端に行くほど y を持ち上げ）
  const kasagiCurve =
    Math.abs(x - 0.5) > 0.32 ? (Math.abs(x - 0.5) - 0.32) * 0.30 : 0;
  const kasagi = sdBox(x, y + kasagiCurve, 0.5, kasagiCY, 0.37, 0.025);
  if (y < waterY + 0.01) b = Math.max(b, sdfToBrightness(kasagi));

  /* --- 島木（笠木のすぐ下）--- */
  const shimagi = sdBox(x, y, 0.5, 0.27, 0.32, 0.013);
  if (y < waterY + 0.01) b = Math.max(b, sdfToBrightness(shimagi));

  /* --- 左柱 --- */
  const leftPillar = sdBox(x, y, 0.27, 0.47, 0.03, 0.25);
  if (y < waterY + 0.01) b = Math.max(b, sdfToBrightness(leftPillar));

  /* --- 右柱 --- */
  const rightPillar = sdBox(x, y, 0.73, 0.47, 0.03, 0.25);
  if (y < waterY + 0.01) b = Math.max(b, sdfToBrightness(rightPillar));

  /* --- 貫 --- */
  const nuki = sdBox(x, y, 0.5, 0.45, 0.28, 0.012);
  if (y < waterY + 0.01) b = Math.max(b, sdfToBrightness(nuki));

  /* --- 水面（波打つライン）--- */
  if (y > waterY - 0.01 && y < waterY + 0.25) {
    const below = y - waterY;
    const wave =
      Math.sin(x * 22 + time * 1.8) * 0.008 +
      Math.sin(x * 41 - time * 1.3) * 0.004;
    const surfaceDist = Math.abs(below - wave);
    if (surfaceDist < 0.006) b = Math.max(b, 0.55);

    // 反射
    if (below > 0 && below < 0.22) {
      const distortion = Math.sin(x * 18 + time * 1.6) * 0.008 * below * 4;
      const my2 = waterY - below + distortion;
      let mirror = 1;
      const mKasagiCurve =
        Math.abs(x - 0.5) > 0.32 ? (Math.abs(x - 0.5) - 0.32) * 0.30 : 0;
      mirror = Math.min(mirror, sdBox(x, my2 + mKasagiCurve, 0.5, kasagiCY, 0.37, 0.025));
      mirror = Math.min(mirror, sdBox(x, my2, 0.5, 0.27, 0.32, 0.013));
      mirror = Math.min(mirror, sdBox(x, my2, 0.27, 0.47, 0.03, 0.25));
      mirror = Math.min(mirror, sdBox(x, my2, 0.73, 0.47, 0.03, 0.25));
      mirror = Math.min(mirror, sdBox(x, my2, 0.5, 0.45, 0.28, 0.012));
      const fade = Math.max(0, 1 - below / 0.22);
      const mb = sdfToBrightness(mirror);
      if (mb > 0) b = Math.max(b, mb * fade * 0.5);
    }
  }

  return b;
};

export default torii;
