import type { MotifFunction } from "./types";
import { sdBox, sdRoundBox, sdTriangle, sdfToBrightness } from "./sdf";

/* ---------- Miyajima ferry ---------- */

/**
 * 宮島行きのフェリーを横から見たシルエット。
 *
 * 構成:
 * - 船体: 下部が丸みを帯びた台形
 * - 船室: 船体上の箱型、窓が並ぶ
 * - 煙突: 船室上に短い煙突、薄い煙が出る
 * - 水面: 下部
 * - 船首の波、航跡のV字波
 *
 * 動き: 船体が周期4.5秒で左右に揺れる。波と煙は常時動く。
 */
export const ferry: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  // --- 船体の左右揺れ ---
  const rock = Math.sin(time * ((2 * Math.PI) / 4.5)) * 0.01;
  // 船体のピッチ（前後傾き）
  const pitch = Math.sin(time * ((2 * Math.PI) / 4.5) + 0.6) * 0.02;

  const waterY = 0.72;
  let brightness = 0;

  /* --- 船体（台形、丸い底）--- */
  const hullCX = 0.5 + rock;
  const hullCY = 0.6;
  // 船体の傾きを反映した座標変換
  const hdx = x - hullCX;
  const hdy = y - hullCY + hdx * pitch;
  // 上辺: hw=0.28、下辺: 底の丸み
  // 上の矩形
  const hullTop = sdBox(hdx, hdy, 0, 0, 0.28, 0.04);
  // 下の丸底（楕円）
  const hullBottomNorm = Math.sqrt((hdx / 0.24) ** 2 + ((hdy - 0.02) / 0.06) ** 2);
  const hullBottom = (hullBottomNorm - 1) * Math.min(0.24, 0.06);
  // 左右テーパー（三角で斜辺）
  const hullLeft = sdTriangle(
    hdx, hdy,
    -0.28, -0.04,
    -0.24, 0.04,
    -0.22, -0.04,
  );
  const hullRight = sdTriangle(
    hdx, hdy,
    0.28, -0.04,
    0.24, 0.04,
    0.22, -0.04,
  );
  const hull = Math.min(
    hullTop,
    Math.min(hullBottom, Math.min(hullLeft, hullRight)),
  );
  brightness = Math.max(brightness, sdfToBrightness(hull, 0.014, 5));

  /* --- 船室（船体上の箱）--- */
  const cabinCX = hullCX - 0.02;
  const cabinCY = hullCY - 0.1;
  const cdx = x - cabinCX;
  const cdy = y - cabinCY + (x - hullCX) * pitch;
  const cabin = sdRoundBox(cdx, cdy, 0, 0, 0.18, 0.055, 0.008);
  brightness = Math.max(brightness, sdfToBrightness(cabin, 0.012, 6));

  /* --- 船室の窓（等間隔）--- */
  if (cabin <= 0) {
    const WIN = 6;
    const winSpan = 0.28;
    let winB = 0;
    for (let i = 0; i < WIN; i++) {
      const wcx = -winSpan / 2 + (winSpan / (WIN - 1)) * i;
      const wd = sdBox(cdx, cdy, wcx, 0, 0.014, 0.022);
      if (wd <= 0) {
        winB = Math.max(winB, 0.15);
      }
    }
    if (winB > 0) {
      // 窓は暗くしない—代わりに背景のコントラストを弱める程度
      brightness = Math.min(brightness, 0.3 + winB);
    }
  }

  /* --- 煙突 --- */
  const stackCX = hullCX + 0.08;
  const stackCY = hullCY - 0.18;
  const stack = sdBox(x, y, stackCX, stackCY, 0.012, 0.03);
  brightness = Math.max(brightness, sdfToBrightness(stack, 0.008, 8));

  /* --- 煙（煙突上、ゆらぐ細い筋）--- */
  if (y < stackCY - 0.02 && y > 0.1) {
    const tRise = time * 0.25;
    const smokeX = stackCX + Math.sin(y * 18 + tRise) * 0.02 * (stackCY - y) * 2;
    const dist = Math.abs(x - smokeX);
    if (dist < 0.012) {
      const core = 1 - dist / 0.012;
      const fade = Math.max(0, (stackCY - y) / 0.4);
      const density = 0.6 + Math.sin(y * 18 - tRise * 3) * 0.4;
      brightness = Math.max(brightness, core * fade * density * 0.35);
    }
  }

  /* --- 水面 --- */
  if (y > waterY - 0.01) {
    // 基本水面ライン + 船首の波
    const bowWaveX = hullCX + 0.28;
    const bowDist = Math.abs(x - bowWaveX);
    // 船首の盛り上がり
    const bowHeight = Math.max(0, 0.018 - bowDist * 0.1) * Math.max(0, 0.05 - bowDist) * 60;
    const wave =
      Math.sin(x * 24 + time * 2) * 0.005 +
      Math.sin(x * 42 - time * 1.4) * 0.003;
    const surfaceY = waterY + wave - bowHeight;
    const surfaceDist = Math.abs(y - surfaceY);
    if (surfaceDist < 0.008) {
      brightness = Math.max(brightness, (1 - surfaceDist / 0.008) * 0.45);
    }

    // --- 航跡（船後方に広がるV字） ---
    const wakeStartX = hullCX - 0.28;
    const wakeDx = wakeStartX - x; // 後方に行くほど +
    if (wakeDx > 0 && wakeDx < 0.35) {
      const spread = wakeDx * 0.5; // V字の広がり
      const offsetY = y - waterY;
      // V字の上下2本の線
      const band1 = Math.abs(offsetY - spread * 0.15);
      const band2 = Math.abs(offsetY + spread * 0.15);
      const bandAnim = Math.sin(wakeDx * 30 - time * 3) * 0.003;
      const wake = Math.min(band1, band2) + bandAnim;
      if (wake < 0.006) {
        const fade = 1 - wakeDx / 0.35;
        brightness = Math.max(brightness, (1 - wake / 0.006) * fade * 0.35);
      }
    }
  }

  return Math.min(1, brightness);
};

export default ferry;
