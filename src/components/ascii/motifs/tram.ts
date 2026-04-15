import type { MotifFunction } from "./types";
import { sdBox, sdCircle, sdRoundBox, sdSegment, sdfToBrightness } from "./sdf";

/* ---------- Hiroden tram ---------- */

/**
 * 広島電鉄の車両を横から見たシルエット。横幅 65%。
 *
 * レイアウト（休止中央位置）:
 *   車体（角丸）   : 中心 (0.5, 0.55), hw=0.325, hh=0.13
 *   窓 5 枚        : 車体内部、等間隔
 *   パンタグラフ   : 車体上の菱形 + 垂直棒
 *   架線           : 上部 y=0.20 の薄い水平線
 *   車輪 2 組      : 下部、スポーク回転
 *   線路           : 最下部
 *
 * 動き:
 *   - 車体が周期 18s で左 → 右へ横移動（端で循環）
 *   - 車輪はスポークが移動量と同期して回転
 */
export const tram: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  // 横移動 (-0.55 〜 +0.55 を 18s 周期で循環)
  const travel = (time / 18) % 1;
  const offset = -0.55 + travel * 1.10;

  let b = 0;

  /* --- 線路 --- */
  const rail = sdSegment(x, y, 0, 0.86, 1, 0.86, 0.004);
  if (rail < 0.004) b = Math.max(b, 0.5);

  /* --- 架線 --- */
  const wire = sdSegment(x, y, 0, 0.20, 1, 0.20, 0.0025);
  if (wire < 0.003) b = Math.max(b, 0.4);

  /* --- 車体（角丸矩形）--- */
  const bodyCX = 0.5 + offset;
  const bodyCY = 0.55;
  const bodyHW = 0.325;
  const bodyHH = 0.13;

  // 早期 reject
  const localX = x - bodyCX;
  if (localX > -0.36 && localX < 0.36) {
    const body = sdRoundBox(x, y, bodyCX, bodyCY, bodyHW, bodyHH, 0.04);
    b = Math.max(b, sdfToBrightness(body));

    /* --- 窓（5 枚、等間隔）--- */
    if (body <= 0) {
      const WINDOWS = 5;
      const winHW = 0.046;
      const winHH = 0.06;
      const winSpan = 0.5; // 端から端まで
      for (let i = 0; i < WINDOWS; i++) {
        const wcx = bodyCX - winSpan / 2 + (winSpan / (WINDOWS - 1)) * i;
        const wd = sdBox(x, y, wcx, bodyCY - 0.015, winHW, winHH);
        if (wd < 0) {
          // 窓内側は車体より「明るい」(背景色寄り) として明度を引き下げる
          // 窓を横切る影
          const t2 = (time * 0.6 + i * 0.7) % 1;
          const shadeX = wcx - winHW + t2 * (winHW * 2);
          const shadeDist = Math.abs(x - shadeX);
          if (shadeDist < 0.01) {
            // 影は車体相当の濃さ
            // do nothing — keep body brightness
          } else {
            // 窓内 → 明度を 0.3 に押し下げ（明るい窓）
            b = Math.min(b, 0.3);
          }
        }
      }
    }
  }

  /* --- パンタグラフ --- */
  const pantoBob = Math.sin(time * 2.1) * 0.005;
  const pCX = bodyCX - 0.08;
  const pCY = 0.32 + pantoBob;
  // 菱形
  const pdx = Math.abs(x - pCX) / 0.06;
  const pdy = Math.abs(y - pCY) / 0.035;
  const pantoNorm = pdx + pdy - 1;
  if (pantoNorm < 0.1) {
    const pantoD = pantoNorm * 0.035;
    b = Math.max(b, sdfToBrightness(pantoD));
  }
  // 垂直棒
  const pPole = sdSegment(x, y, pCX, pCY + 0.02, pCX, bodyCY - bodyHH, 0.005);
  if (pPole < 0.005) b = Math.max(b, sdfToBrightness(pPole));

  /* --- 車輪（2 組、スポーク回転）--- */
  const wheelY = 0.82;
  const wheelR = 0.045;
  const wheelXs = [bodyCX - 0.20, bodyCX + 0.20];
  // 走行に同期した回転角
  const wheelAng = (travel * 1.10) / wheelR;
  for (const wcx of wheelXs) {
    const wd = sdCircle(x, y, wcx, wheelY, wheelR);
    if (wd < 0.01) {
      b = Math.max(b, sdfToBrightness(wd));
      // スポーク
      if (wd < 0) {
        const dx = x - wcx;
        const dy = y - wheelY;
        const r = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx);
        let minSpoke = 1;
        for (let k = 0; k < 4; k++) {
          const sa = (Math.PI / 2) * k + wheelAng;
          let diff = Math.abs(ang - sa);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff > Math.PI / 2) diff = Math.PI - diff;
          const sd = diff * r;
          if (sd < minSpoke) minSpoke = sd;
        }
        if (minSpoke < 0.004) b = Math.max(b, 0.85);
      }
    }
  }

  return b;
};

export default tram;
