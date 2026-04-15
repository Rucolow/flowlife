import type { MotifFunction } from "./types";
import { sdfToBrightness } from "./sdf";

/* ---------- Oyster ---------- */

/**
 * 牡蠣の殻。不規則な楕円。表面に同心円状の成長線（ひだ）。
 * ゆっくり開閉する（周期9秒）。
 */
export const oyster: MotifFunction = (nx, ny, time) => {
  // 殻の中心（やや左寄り）
  const cx = 0.5;
  const cy = 0.52;
  const dx = nx - cx;
  const dy = ny - cy;

  // 粗い境界 reject
  if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.32) return 0;

  // 楕円の半径関数: 角度に応じて不規則にする
  const ang = Math.atan2(dy, dx);
  // 基本半径 + 角度で凸凹 + 時間で微かに呼吸
  const breath = Math.sin(time * ((2 * Math.PI) / 9)) * 0.015;
  const irreg =
    Math.sin(ang * 3 + 0.7) * 0.03 +
    Math.sin(ang * 7 + 2.1) * 0.015 +
    Math.sin(ang * 5 - 1.4) * 0.01;
  const baseRx = 0.28;
  const baseRy = 0.2;

  // 開閉による上下分離（周期9秒、殻が少し開いて中が見える）
  // 開き度 0〜1
  const openness = (Math.sin(time * ((2 * Math.PI) / 9)) + 1) * 0.5;
  const gap = openness * 0.012;

  // 上殻と下殻で輪郭を変える（上殻は y<0, 下殻は y>0）
  const isUpper = dy < 0;
  const yShift = isUpper ? -gap : gap;
  const dyShifted = dy - yShift;

  // 楕円状の距離（極座標近似）
  const rx = baseRx + irreg + breath;
  const ry = baseRy + irreg * 0.7 + breath * 0.8;
  const ellipseNorm = Math.sqrt((dx / rx) ** 2 + (dyShifted / ry) ** 2);
  // d = 0 が境界、<0 内部、>0 外部
  const shellD = (ellipseNorm - 1) * Math.min(rx, ry);

  let brightness = sdfToBrightness(shellD, 0.018, 4);

  // --- 殻の合わせ目（中央の暗い横線）---
  if (shellD <= 0) {
    const seamDist = Math.abs(dy - (isUpper ? -gap : gap));
    // 上下どちらの殻からも内側にある領域が「合わせ目」
    if (Math.abs(dy) < gap + 0.006) {
      // 中が見える部分（ごく薄い明部）
      const innerReveal =
        openness * (1 - Math.abs(dy) / (gap + 0.006)) * 0.7;
      brightness = Math.max(brightness, innerReveal);
    } else if (seamDist < 0.008) {
      const seamB = (1 - seamDist / 0.008) * 0.55;
      brightness = Math.max(brightness, seamB);
    }

    // --- 同心円状の成長線（ひだ） ---
    // 殻の中央から外側へ、等間隔の薄い縞
    const distFromCenter = Math.sqrt(dx * dx + dyShifted * dyShifted);
    // 殻内の正規化距離 0〜1
    const tNorm = distFromCenter / Math.max(rx, ry);
    // ひだの波。時間でごく微かに動く（呼吸）
    const ridges =
      Math.sin(tNorm * 40 + Math.sin(time * 0.3) * 0.5) * 0.5 + 0.5;
    // ridges を明暗へ（中心ほど薄く、外周でも控えめに）
    const ridgeIntensity = (1 - tNorm * 0.4) * 0.25;
    brightness = Math.max(brightness, brightness + ridges * ridgeIntensity);
    if (brightness > 1) brightness = 1;
  }

  return brightness;
};

export default oyster;
