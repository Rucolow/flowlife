import type { MotifFunction } from "./types";
import { sdBox, sdCircle, sdRoundBox, sdSegment, sdfToBrightness } from "./sdf";

/* ---------- Hiroden tram ---------- */

/**
 * 広島電鉄の車両を横から見たシルエット。
 * 左から右へゆっくり横移動し、右端で消えたら左端から再出現する。
 * 周期18秒。
 *
 * 構成:
 * - 車体: 角丸矩形。等間隔の窓
 * - パンタグラフ: 車体上の菱形、わずかに上下する
 * - 車輪: 下部に2組。内部スポークが回転
 * - 線路: 最下部の細い水平線
 */
export const tram: MotifFunction = (nx, ny, time) => {
  // 横移動（周期18秒）。 -0.4 〜 1.4 の範囲を往復せず、一方向ループ。
  const travel = (time / 18) % 1;
  const tramCX = -0.3 + travel * 1.6;

  const x = nx;
  const y = ny;

  // 線路（常時表示）
  const rail = sdSegment(x, y, 0, 0.82, 1, 0.82, 0.003);
  let brightness = sdfToBrightness(rail, 0.006, 10) * 0.45;

  // 車体の水平位置に基づいて早期 reject
  const localX = x - tramCX;
  if (localX < -0.32 || localX > 0.32) return brightness;

  const bodyCY = 0.55;

  // パンタグラフの上下（周期3秒）
  const pantoBob = Math.sin(time * 2.1) * 0.005;

  // --- 車体（角丸矩形）---
  const body = sdRoundBox(x, y, tramCX, bodyCY, 0.28, 0.13, 0.03);
  const bodyB = sdfToBrightness(body, 0.014, 5);
  brightness = Math.max(brightness, bodyB);

  // --- 窓（等間隔、車体内部）---
  if (body <= 0) {
    // 5枚窓
    const WINDOWS = 5;
    const winHW = 0.032;
    const winHH = 0.045;
    const winSpan = 0.22;
    let winB = 0;
    for (let i = 0; i < WINDOWS; i++) {
      const wcx = tramCX - winSpan / 2 + (winSpan / (WINDOWS - 1)) * i;
      const wd = sdBox(x, y, wcx, bodyCY - 0.01, winHW, winHH);
      if (wd <= 0) {
        // 窓内は背景を覗かせるように少し暗くする（描画しない領域寄せ）
        // ただし完全に透明にはせず、窓の中に影を残す
        const t2 = (time * 0.6 + i * 0.7) % 1;
        const shadeX = wcx - winHW + t2 * (winHW * 2);
        const shadeDist = Math.abs(x - shadeX);
        if (shadeDist < 0.008) {
          winB = Math.max(winB, (1 - shadeDist / 0.008) * 0.55);
        } else {
          // 窓枠だけ残す（内部は薄く）
          winB = Math.max(winB, 0.12);
        }
        // 窓のフレームは元のbody brightnessを残しつつ内部を明確に変える
        brightness = Math.min(brightness, 0.35 + winB * 0.65);
      }
    }
  }

  // --- パンタグラフ（車体上部の菱形）---
  const pantoCX = tramCX - 0.05;
  const pantoCY = 0.38 + pantoBob;
  const pdx = Math.abs(x - pantoCX) / 0.05;
  const pdy = Math.abs(y - pantoCY) / 0.03;
  const pantoDiamond = (pdx + pdy - 1) * 0.03;
  brightness = Math.max(brightness, sdfToBrightness(pantoDiamond, 0.006, 10));
  // パンタグラフを車体に繋ぐ垂直棒
  const pantoPole = sdSegment(x, y, pantoCX, pantoCY + 0.02, pantoCX, bodyCY - 0.13, 0.003);
  brightness = Math.max(brightness, sdfToBrightness(pantoPole, 0.005, 10));
  // 架線（ごく薄い水平線）
  const wire = sdSegment(x, y, 0, 0.33, 1, 0.33, 0.001);
  brightness = Math.max(brightness, sdfToBrightness(wire, 0.004, 8) * 0.35);

  // --- 車輪（2組、回転スポーク）---
  const wheelCYv = 0.75;
  const wheelR = 0.035;
  const wheelCenters = [tramCX - 0.17, tramCX + 0.17];
  // 回転角（車輪の円周 = 2πr、移動距離に比例）
  const wheelAng = (travel * 1.6) / wheelR; // rad
  for (const wcx of wheelCenters) {
    const wd = sdCircle(x, y, wcx, wheelCYv, wheelR);
    const wB = sdfToBrightness(wd, 0.008, 6);
    if (wB > 0) {
      brightness = Math.max(brightness, wB * 0.7);
      // スポーク（4本）
      if (wd <= 0) {
        const dx = x - wcx;
        const dy = y - wheelCYv;
        const r = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx);
        let minSpoke = 1;
        for (let k = 0; k < 4; k++) {
          const spokeAng = (Math.PI / 2) * k + wheelAng;
          let diff = Math.abs(ang - spokeAng);
          if (diff > Math.PI) diff = Math.PI * 2 - diff;
          if (diff > Math.PI / 2) diff = Math.PI - diff;
          const sdist = diff * r;
          if (sdist < minSpoke) minSpoke = sdist;
        }
        const spokeB = sdfToBrightness(minSpoke - 0.002, 0.005, 10) * 0.8;
        brightness = Math.max(brightness, spokeB);
      }
    }
  }

  return brightness;
};

export default tram;
