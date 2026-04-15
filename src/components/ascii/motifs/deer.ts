import type { MotifFunction } from "./types";
import {
  sdEllipse,
  sdSegment,
  sdTriangle,
  sdfToBrightness,
} from "./sdf";

/* ---------- Miyajima deer ---------- */

/**
 * 宮島の鹿。横向きに立っている。角があり、耳がピクッと動く。
 *
 * 構成:
 * - 頭: 小さな楕円 + 耳2つ + 角
 * - 胴体: 大きな楕円（呼吸で微かに伸縮）
 * - 脚: 4本の細い線（静止）
 * - 尾: 短い三角（左右に揺れる）
 *
 * 動き: 頭 5-7s 周期、耳 3-4s、尾 3s、呼吸 4s。
 */
export const deer: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  if (y < 0.15 || y > 0.9) return 0;
  if (x < 0.05 || x > 0.95) return 0;

  // --- 呼吸（胴体伸縮） ---
  const breath = Math.sin(time * ((2 * Math.PI) / 4)) * 0.008;

  // --- 頭の上下（草を食む動き、周期6秒）---
  const headBob = Math.sin(time * ((2 * Math.PI) / 6)) * 0.025 - 0.005;

  // --- 尾の揺れ ---
  const tailSway = Math.sin(time * ((2 * Math.PI) / 3)) * 0.012;

  // --- 耳のピクッと動き（不規則）---
  // 各耳に別位相。短いスパイクを与える。
  const earTrigger1 = Math.max(0, Math.sin(time * 1.9 + 0.5) - 0.85) * 8;
  const earTrigger2 = Math.max(0, Math.sin(time * 2.3 + 2.1) - 0.85) * 8;

  /* --- 胴体 --- */
  const bodyCX = 0.5;
  const bodyCY = 0.55;
  const body = sdEllipse(x, y, bodyCX, bodyCY, 0.22, 0.1 + breath);
  let brightness = sdfToBrightness(body, 0.014, 4.5);

  /* --- 首 --- */
  const neck = sdEllipse(x, y, 0.72, 0.43 + headBob * 0.6, 0.05, 0.08);
  brightness = Math.max(brightness, sdfToBrightness(neck, 0.014, 5));

  /* --- 頭 --- */
  const headCX = 0.78;
  const headCY = 0.35 + headBob;
  const head = sdEllipse(x, y, headCX, headCY, 0.055, 0.04);
  brightness = Math.max(brightness, sdfToBrightness(head, 0.012, 5.5));

  // 鼻先（頭から前に突き出す小さな楕円）
  const nose = sdEllipse(x, y, 0.84, headCY + 0.005, 0.02, 0.015);
  brightness = Math.max(brightness, sdfToBrightness(nose, 0.01, 6));

  /* --- 耳（左右、根本は頭） --- */
  // 左耳（奥、やや小さい）
  const lEarBase = [headCX - 0.005, headCY - 0.035] as const;
  const lEarAng = -Math.PI / 3 - earTrigger1;
  const lEarTip = [
    lEarBase[0] + Math.cos(lEarAng) * 0.05,
    lEarBase[1] + Math.sin(lEarAng) * 0.05,
  ] as const;
  const leftEar = sdTriangle(
    x, y,
    lEarBase[0] - 0.012, lEarBase[1],
    lEarBase[0] + 0.012, lEarBase[1],
    lEarTip[0], lEarTip[1],
  );
  brightness = Math.max(brightness, sdfToBrightness(leftEar, 0.01, 7));

  // 右耳（手前）
  const rEarBase = [headCX + 0.015, headCY - 0.03] as const;
  const rEarAng = -Math.PI / 2.2 - earTrigger2 * 0.8;
  const rEarTip = [
    rEarBase[0] + Math.cos(rEarAng) * 0.055,
    rEarBase[1] + Math.sin(rEarAng) * 0.055,
  ] as const;
  const rightEar = sdTriangle(
    x, y,
    rEarBase[0] - 0.012, rEarBase[1],
    rEarBase[0] + 0.012, rEarBase[1],
    rEarTip[0], rEarTip[1],
  );
  brightness = Math.max(brightness, sdfToBrightness(rightEar, 0.01, 7));

  /* --- 角（枝分かれ）--- */
  const antlerBaseX = headCX + 0.005;
  const antlerBaseY = headCY - 0.035;
  const antlerSeg = [
    sdSegment(x, y, antlerBaseX, antlerBaseY, antlerBaseX + 0.025, antlerBaseY - 0.06, 0.006),
    sdSegment(x, y, antlerBaseX + 0.025, antlerBaseY - 0.06, antlerBaseX + 0.06, antlerBaseY - 0.095, 0.006),
    sdSegment(x, y, antlerBaseX + 0.025, antlerBaseY - 0.06, antlerBaseX + 0.005, antlerBaseY - 0.1, 0.005),
    sdSegment(x, y, antlerBaseX + 0.045, antlerBaseY - 0.08, antlerBaseX + 0.075, antlerBaseY - 0.11, 0.005),
    sdSegment(x, y, antlerBaseX, antlerBaseY, antlerBaseX - 0.02, antlerBaseY - 0.065, 0.005),
    sdSegment(x, y, antlerBaseX - 0.02, antlerBaseY - 0.065, antlerBaseX - 0.04, antlerBaseY - 0.095, 0.004),
  ];
  const antlerD = Math.min(...antlerSeg);
  brightness = Math.max(brightness, sdfToBrightness(antlerD, 0.008, 10));

  /* --- 脚（4本） --- */
  const legY1 = 0.55 + 0.07; // 脚の上端
  const legY2 = 0.88;        // 脚の下端
  const legs = [
    sdSegment(x, y, 0.35, legY1, 0.34, legY2, 0.008),
    sdSegment(x, y, 0.44, legY1, 0.44, legY2, 0.008),
    sdSegment(x, y, 0.6, legY1, 0.6, legY2, 0.008),
    sdSegment(x, y, 0.67, legY1, 0.68, legY2, 0.008),
  ];
  const legD = Math.min(...legs);
  brightness = Math.max(brightness, sdfToBrightness(legD, 0.008, 7));

  /* --- 尾（左右に揺れる三角）--- */
  const tailBaseX = 0.28;
  const tailBaseY = 0.53;
  const tailTipX = tailBaseX - 0.035 + tailSway;
  const tailTipY = tailBaseY + 0.01;
  const tail = sdTriangle(
    x, y,
    tailBaseX, tailBaseY - 0.01,
    tailBaseX, tailBaseY + 0.01,
    tailTipX, tailTipY,
  );
  brightness = Math.max(brightness, sdfToBrightness(tail, 0.008, 8));

  return brightness;
};

export default deer;
