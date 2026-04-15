import type { MotifFunction } from "./types";
import { sdBox, sdEllipse, sdfToBrightness } from "./sdf";

/* ---------- Atomic Bomb Dome ---------- */

/**
 * 原爆ドーム（正面シルエット）。キャンバス中央に大きく配置する。
 *
 * レイアウト（正規化座標、原点 = 左上）:
 *   ドーム（半楕円）  : cx=0.5, 上端 y=0.15, 下端 y=0.45, 横幅 0.35
 *   建物本体          : cx=0.5, 上端 y=0.45, 下端 y=0.75, 横幅 0.30
 *   左の壁            : x ∈ [0.20, 0.30], y ∈ [0.30, 0.70]、上端は不規則
 *   右の壁            : x ∈ [0.70, 0.80], y ∈ [0.35, 0.70]、上端は不規則
 *   ドーム内 鉄骨リブ : 中央から放射状に 7 本（時間で微かに揺れる）
 *
 * 動き:
 *   - 全体に sin の陽炎歪み（水平方向の微弱な揺らぎ）
 *   - リブが風で微かにスイング
 *   - マウス位置に応じて陰影の方向が変化
 */
export const dome: MotifFunction = (nx, ny, time, mx, my) => {
  // 陽炎（水平の微小歪み）
  const heat =
    Math.sin(ny * 13 + time * 0.7) * 0.0035 +
    Math.sin(ny * 27 - time * 0.5) * 0.002;
  const x = nx + heat;
  const y = ny;

  // 早期 reject — 建物の外側
  if (y < 0.13 || y > 0.78) return 0;
  if (x < 0.17 || x > 0.83) return 0;

  let b = 0;

  /* --- 建物本体（矩形、cx=0.5, cy=0.6, hw=0.15, hh=0.15）--- */
  const body = sdBox(x, y, 0.5, 0.6, 0.15, 0.15);
  b = Math.max(b, sdfToBrightness(body));

  /* --- ドーム（半楕円）---
   * 楕円: 中心 (0.5, 0.45), rx=0.175, ry=0.30
   * y <= 0.45 のみ（上半分）
   */
  const ellipseD = sdEllipse(x, y, 0.5, 0.45, 0.175, 0.3);
  // 下半カット: y > 0.45 で正値（外側）
  const halfPlane = y - 0.45;
  const domeD = Math.max(ellipseD, halfPlane);
  b = Math.max(b, sdfToBrightness(domeD));

  /* --- 左の壁（不規則な上端）--- */
  const lwTopNoise =
    Math.sin(x * 70) * 0.012 +
    Math.sin(x * 130 + 1.3) * 0.006;
  const lwTop = 0.30 + lwTopNoise;
  if (y >= lwTop) {
    // 中心 (0.25, 0.50), hw=0.05, hh=0.20
    const lw = sdBox(x, y, 0.25, 0.5, 0.05, 0.2);
    b = Math.max(b, sdfToBrightness(lw));
  }

  /* --- 右の壁（不規則な上端）--- */
  const rwTopNoise =
    Math.sin(x * 65 + 2.1) * 0.012 +
    Math.sin(x * 110 - 0.7) * 0.006;
  const rwTop = 0.35 + rwTopNoise;
  if (y >= rwTop) {
    // 中心 (0.75, 0.525), hw=0.05, hh=0.175
    const rw = sdBox(x, y, 0.75, 0.525, 0.05, 0.175);
    b = Math.max(b, sdfToBrightness(rw));
  }

  /* --- 土台（建物下に薄く伸びる）--- */
  const base = sdBox(x, y, 0.5, 0.755, 0.32, 0.012);
  b = Math.max(b, sdfToBrightness(base));

  /* --- ドーム内の鉄骨リブ（放射状）--- */
  // ドーム形状の内側で、y <= 0.45 の範囲
  if (domeD <= 0 && y <= 0.46) {
    const dcx = 0.5;
    const dcy = 0.45;
    const dx = x - dcx;
    const dy = y - dcy;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > 0.005) {
      const ang = Math.atan2(-dy, dx); // 0〜π（上が π/2）
      const sway = Math.sin(time * 0.9) * 0.04;
      const RIBS = 7;
      let minRib = 1;
      for (let i = 0; i < RIBS; i++) {
        const ribAng = (Math.PI * (i + 0.5)) / RIBS + sway * Math.sin(ang * 2);
        let diff = Math.abs(ang - ribAng);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        const ribDist = diff * r;
        if (ribDist < minRib) minRib = ribDist;
      }
      // 細い線として描画。中心ほど濃く。
      if (minRib < 0.006) {
        b = Math.max(b, 0.95);
      } else if (minRib < 0.012) {
        b = Math.max(b, 0.7);
      }
      // 水平方向の弧（2本）
      const arc1 = Math.abs(r - 0.13);
      const arc2 = Math.abs(r - 0.22);
      const arcMin = Math.min(arc1, arc2);
      if (arcMin < 0.004) b = Math.max(b, 0.8);
    }
  }

  /* --- マウス追従：仮想光源で微かに陰影 --- */
  if (b > 0) {
    const lx = (mx - 0.5) * 1.4;
    const ly = (my - 0.5) * 1.4;
    const dot = (x - 0.5) * lx + (y - 0.55) * ly;
    b = Math.max(0, Math.min(1, b * (1 + dot * 0.35)));
  }

  return b;
};

export default dome;
