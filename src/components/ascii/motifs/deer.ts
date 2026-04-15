import type { MotifFunction } from "./types";
import { sdEllipse, sdSegment, sdTriangle, sdfToBrightness } from "./sdf";

/* ---------- Miyajima deer ---------- */

/**
 * 宮島の鹿。横向きに立つ大きなシルエット。
 *
 * レイアウト:
 *   胴体（楕円）  : 中心 (0.43, 0.5)、rx=0.22, ry=0.10
 *   首           : (0.62, 0.42) 楕円
 *   頭（楕円）   : 中心 (0.78, 0.32)、rx=0.07, ry=0.05
 *   鼻先         : (0.86, 0.34)
 *   2 耳         : 頭の上に
 *   角           : 頭の上から枝分かれ
 *   4 脚         : 太い線で底面まで
 *   尾           : 胴体左端から
 *
 * 動き:
 *   - 頭の上下（草を食む、6s）
 *   - 耳のピクッ（不規則）
 *   - 尾の揺れ、呼吸
 */
export const deer: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  if (y < 0.12 || y > 0.95) return 0;
  if (x < 0.04 || x > 0.97) return 0;

  // 動き
  const breath = Math.sin(time * ((2 * Math.PI) / 4)) * 0.008;
  const headBob = Math.sin(time * ((2 * Math.PI) / 6)) * 0.025 - 0.005;
  const tailSway = Math.sin(time * ((2 * Math.PI) / 3)) * 0.012;
  // 耳のスパイク（短い周期で稀に動く）
  const ear1Spike = Math.max(0, Math.sin(time * 1.9 + 0.5) - 0.85) * 8;
  const ear2Spike = Math.max(0, Math.sin(time * 2.3 + 2.1) - 0.85) * 8;

  let b = 0;

  /* --- 胴体 --- */
  const body = sdEllipse(x, y, 0.43, 0.5, 0.22, 0.10 + breath);
  b = Math.max(b, sdfToBrightness(body));

  /* --- 首 --- */
  const neck = sdEllipse(x, y, 0.65, 0.43 + headBob * 0.6, 0.07, 0.09);
  b = Math.max(b, sdfToBrightness(neck));

  /* --- 頭 --- */
  const headCX = 0.78;
  const headCY = 0.32 + headBob;
  const head = sdEllipse(x, y, headCX, headCY, 0.07, 0.05);
  b = Math.max(b, sdfToBrightness(head));

  // 鼻先
  const nose = sdEllipse(x, y, 0.87, headCY + 0.005, 0.025, 0.018);
  b = Math.max(b, sdfToBrightness(nose));

  /* --- 耳 --- */
  // 左耳
  const lEarBaseX = headCX - 0.005;
  const lEarBaseY = headCY - 0.045;
  const lEarAng = -Math.PI / 3 - ear1Spike;
  const lEarTipX = lEarBaseX + Math.cos(lEarAng) * 0.06;
  const lEarTipY = lEarBaseY + Math.sin(lEarAng) * 0.06;
  const leftEar = sdTriangle(
    x, y,
    lEarBaseX - 0.018, lEarBaseY,
    lEarBaseX + 0.018, lEarBaseY,
    lEarTipX, lEarTipY,
  );
  b = Math.max(b, sdfToBrightness(leftEar));

  // 右耳
  const rEarBaseX = headCX + 0.022;
  const rEarBaseY = headCY - 0.04;
  const rEarAng = -Math.PI / 2.2 - ear2Spike * 0.8;
  const rEarTipX = rEarBaseX + Math.cos(rEarAng) * 0.065;
  const rEarTipY = rEarBaseY + Math.sin(rEarAng) * 0.065;
  const rightEar = sdTriangle(
    x, y,
    rEarBaseX - 0.018, rEarBaseY,
    rEarBaseX + 0.018, rEarBaseY,
    rEarTipX, rEarTipY,
  );
  b = Math.max(b, sdfToBrightness(rightEar));

  /* --- 角（太く枝分かれ）--- */
  // 中心軸
  const aBaseX = headCX + 0.005;
  const aBaseY = headCY - 0.045;
  const antlers = [
    sdSegment(x, y, aBaseX, aBaseY, aBaseX + 0.02, aBaseY - 0.08, 0.01),
    sdSegment(x, y, aBaseX + 0.02, aBaseY - 0.08, aBaseX + 0.06, aBaseY - 0.13, 0.009),
    sdSegment(x, y, aBaseX + 0.025, aBaseY - 0.09, aBaseX + 0.0, aBaseY - 0.14, 0.008),
    sdSegment(x, y, aBaseX + 0.045, aBaseY - 0.10, aBaseX + 0.085, aBaseY - 0.15, 0.008),
    sdSegment(x, y, aBaseX, aBaseY, aBaseX - 0.025, aBaseY - 0.085, 0.008),
    sdSegment(x, y, aBaseX - 0.025, aBaseY - 0.085, aBaseX - 0.05, aBaseY - 0.13, 0.007),
  ];
  const antlerD = Math.min(...antlers);
  b = Math.max(b, sdfToBrightness(antlerD));

  /* --- 脚（4本、太く描画）--- */
  const legTopY = 0.58;
  const legBotY = 0.92;
  const legs = [
    sdSegment(x, y, 0.30, legTopY, 0.29, legBotY, 0.018),
    sdSegment(x, y, 0.40, legTopY, 0.40, legBotY, 0.018),
    sdSegment(x, y, 0.55, legTopY, 0.55, legBotY, 0.018),
    sdSegment(x, y, 0.62, legTopY, 0.63, legBotY, 0.018),
  ];
  const legD = Math.min(...legs);
  b = Math.max(b, sdfToBrightness(legD));

  /* --- 尾 --- */
  const tail = sdTriangle(
    x, y,
    0.21, 0.48,
    0.21, 0.52,
    0.16 + tailSway, 0.51,
  );
  b = Math.max(b, sdfToBrightness(tail));

  return b;
};

export default deer;
