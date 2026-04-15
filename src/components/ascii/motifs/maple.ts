import type { MotifFunction } from "./types";
import { sdSegment, sdfToBrightness } from "./sdf";

/* ---------- Maple leaf ---------- */

/**
 * もみじの葉。上を向いた5枚の裂片を持つ。
 *
 * 配置（葉が回転していない状態）:
 *   - 中央裂片: 真上（0°）
 *   - 上側の裂片 2枚: 左右 ±60°
 *   - 下側の裂片 2枚: 左右 ±120°
 *   - 葉柄: 真下（180°）
 *
 * 動き:
 * - 葉全体がゆっくり回転（約 40秒で1回転）
 * - 風による不規則な揺れ（周期4-6秒）
 * - 各裂片の先端が微かに波打つ
 */
export const maple: MotifFunction = (nx, ny, time) => {
  // 全体回転角度 + 風揺れ
  const rot =
    time * ((2 * Math.PI) / 40) +
    Math.sin(time * ((2 * Math.PI) / 5)) * 0.15 +
    Math.sin(time * ((2 * Math.PI) / 4.2) + 1.1) * 0.08;

  // 中心 (0.5, 0.52) 周りに逆回転して正規化座標に変換
  const cx = 0.5;
  const cy = 0.52;
  const dx = nx - cx;
  const dy = ny - cy;
  const cosA = Math.cos(-rot);
  const sinA = Math.sin(-rot);
  const x = dx * cosA - dy * sinA;
  const y = dx * sinA + dy * cosA;

  const r = Math.sqrt(x * x + y * y);
  if (r > 0.42) return 0;

  // atan2(y, x): +X = 0, +Y(下) = π/2, -Y(上) = -π/2
  const ang = Math.atan2(y, x);

  // 5裂片: 上向きを中心に対称配置。角度は「上方向 -π/2」からのオフセット。
  // 上側の裂片を長く、下側を短く（標準的なもみじ形）
  const DEG = Math.PI / 180;
  const UP = -Math.PI / 2;
  type Lobe = { ang: number; maxR: number; halfWidth: number };
  const lobes: Lobe[] = [
    { ang: UP,              maxR: 0.4,  halfWidth: 28 * DEG }, // 中央（最大）
    { ang: UP - 55 * DEG,   maxR: 0.36, halfWidth: 26 * DEG }, // 上左
    { ang: UP + 55 * DEG,   maxR: 0.36, halfWidth: 26 * DEG }, // 上右
    { ang: UP - 115 * DEG,  maxR: 0.26, halfWidth: 22 * DEG }, // 下左
    { ang: UP + 115 * DEG,  maxR: 0.26, halfWidth: 22 * DEG }, // 下右
  ];

  let brightness = 0;

  for (let i = 0; i < lobes.length; i++) {
    const l = lobes[i];
    let diff = Math.abs(ang - l.ang);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff > l.halfWidth) continue;

    const tipFlutter = Math.sin(time * 1.5 + i * 1.2) * 0.015;
    const maxR = l.maxR + tipFlutter;
    if (r > maxR) continue;

    // 根元→先端での位置 (0〜1)
    const tNorm = r / maxR;
    // 根元で広く、先端でとがる
    const widthFrac =
      (1 - Math.pow(tNorm, 2.5) * 0.85) * (1 - Math.pow(tNorm, 8) * 0.5);
    const localHalf = l.halfWidth * widthFrac;
    if (diff > localHalf) continue;

    // 裂片エッジからの距離（r と角度差の両方を考慮）
    const edgeDist = (localHalf - diff) * r * 0.6 + (maxR - r) * 0.4;
    const b = sdfToBrightness(-edgeDist, 0.01, 6);
    if (b > brightness) brightness = b;
  }

  // 葉脈（中央から各裂片の先端へ）
  if (brightness > 0) {
    let minVein = 1;
    for (const l of lobes) {
      const endX = Math.cos(l.ang) * l.maxR * 0.88;
      const endY = Math.sin(l.ang) * l.maxR * 0.88;
      const v = sdSegment(x, y, 0, 0, endX, endY, 0.002);
      if (v < minVein) minVein = v;
    }
    const veinB = sdfToBrightness(minVein, 0.004, 12);
    brightness = Math.max(brightness, veinB);
  }

  // 葉柄（下方向に伸びる細い茎）
  const stem = sdSegment(x, y, 0, 0, 0, 0.2, 0.004);
  const stemB = sdfToBrightness(stem, 0.005, 9);
  brightness = Math.max(brightness, stemB);

  return brightness;
};

export default maple;
