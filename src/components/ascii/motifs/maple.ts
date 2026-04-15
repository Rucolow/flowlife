import type { MotifFunction } from "./types";
import { sdSegment, sdfToBrightness } from "./sdf";

/* ---------- Maple leaf ---------- */

/**
 * もみじの葉。5枚の鋭い裂片を持つ。
 *
 * 動き:
 * - 葉全体がゆっくり回転（約 40秒で1回転）
 * - 風による不規則な揺れ（周期4-6秒）
 * - 各裂片の先端が微かに波打つ
 */
export const maple: MotifFunction = (nx, ny, time) => {
  // 全体回転角度
  const baseAng = time * ((2 * Math.PI) / 40);
  // 風揺れ（非軸回転に加算）
  const wind =
    Math.sin(time * ((2 * Math.PI) / 5)) * 0.15 +
    Math.sin(time * ((2 * Math.PI) / 4.2) + 1.1) * 0.08;
  const rot = baseAng + wind;

  // 中心 (0.5, 0.5) 周りに逆回転して正規化座標に変換
  const cx = 0.5;
  const cy = 0.52;
  const dx = nx - cx;
  const dy = ny - cy;
  const cosA = Math.cos(-rot);
  const sinA = Math.sin(-rot);
  const x = dx * cosA - dy * sinA;
  const y = dx * sinA + dy * cosA;

  // 極座標
  const r = Math.sqrt(x * x + y * y);
  if (r > 0.42) return 0;

  // 葉本体は先端に向かって裂ける。葉を angle に沿った形で定義する。
  // ここでは5枚の三角裂片 + 中央の丸みで構成する。
  const ang = Math.atan2(y, x); // -π〜π（上が -π/2）

  // 5枚の裂片: 上方向を中心に ±2π/5 の間隔
  // 中心裂片は「上方向」= ang = -π/2
  const LOBES = 5;
  const spread = (Math.PI * 1.6) / LOBES; // 各裂片の角度幅
  const lobeAngles: number[] = [];
  for (let i = 0; i < LOBES; i++) {
    lobeAngles.push(-Math.PI / 2 + ((i - 2) * (Math.PI * 1.6)) / (LOBES - 1));
  }

  // 各裂片の最大半径（中央が最大、両端に行くほど短い）
  const lobeMaxR = [0.22, 0.32, 0.38, 0.32, 0.22];

  let brightness = 0;

  for (let i = 0; i < LOBES; i++) {
    const la = lobeAngles[i];
    let diff = Math.abs(ang - la);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff > spread) continue;
    // 裂片内での位置（t: 根元0→先端1）
    const tipFlutter = Math.sin(time * 1.5 + i * 1.2) * 0.02;
    const maxR = lobeMaxR[i] + tipFlutter;
    if (r > maxR) continue;
    // 半径の関数として幅を決める: 根元で広く、先端でやや狭く、最先端で鋭く
    const tNorm = r / maxR; // 0〜1
    const widthBase = spread * (1 - tNorm * 0.2) * (1 - Math.pow(tNorm, 4) * 0.6);
    if (diff > widthBase) continue;
    // エッジへの距離（角度差で簡易近似）
    const edgeDist = (widthBase - diff) * r;
    const b = sdfToBrightness(-edgeDist, 0.015, 4.5);
    if (b > brightness) brightness = b;
  }

  // 葉脈（中央から各裂片へ）
  if (brightness > 0) {
    let minVein = 1;
    for (let i = 0; i < LOBES; i++) {
      const la = lobeAngles[i];
      const maxR = lobeMaxR[i];
      const endX = Math.cos(la) * maxR * 0.85;
      const endY = Math.sin(la) * maxR * 0.85;
      const v = sdSegment(x, y, 0, 0, endX, endY, 0.002);
      if (v < minVein) minVein = v;
    }
    const veinB = sdfToBrightness(minVein, 0.004, 12) * 0.7;
    brightness = Math.max(brightness, veinB);
  }

  // 葉柄（根元から外側へ出る茎）
  // 中心裂片の反対方向（ang = π/2 方向）に伸びる
  const stemEndX = Math.cos(Math.PI / 2) * 0.18;
  const stemEndY = Math.sin(Math.PI / 2) * 0.18;
  const stem = sdSegment(x, y, 0, 0, stemEndX, stemEndY, 0.003);
  const stemB = sdfToBrightness(stem, 0.005, 9);
  brightness = Math.max(brightness, stemB);

  return brightness;
};

export default maple;
