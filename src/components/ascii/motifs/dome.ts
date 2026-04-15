import type { MotifFunction } from "./types";

/* ---------- SDF helpers ---------- */

function sdCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
): number {
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

function sdEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): number {
  const nx = (px - cx) / rx;
  const ny = (py - cy) / ry;
  return (Math.sqrt(nx * nx + ny * ny) - 1) * Math.min(rx, ry);
}

function sdBox(
  px: number,
  py: number,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
): number {
  const dx = Math.abs(px - cx) - hw;
  const dy = Math.abs(py - cy) - hh;
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(dx, dy), 0);
}

function sdSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thickness: number,
): number {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy) - thickness;
}

function opUnion(a: number, b: number): number {
  return Math.min(a, b);
}

/* ---------- brightness mapping ---------- */

/** shared sdf helper — see ./sdf.ts */
function sdfToBrightness(
  d: number,
  edge: number,
  depthScale: number,
): number {
  if (d > edge) return 0;
  if (d > 0) return (1 - d / edge) * 0.45;
  return Math.min(0.95, 0.55 + Math.abs(d) * depthScale * 0.5);
}

/* ---------- Atomic Bomb Dome ---------- */

/**
 * 原爆ドーム（正面シルエット）。
 *
 * レイアウト（nx, ny 正規化座標）:
 * - ドーム楕円: 中央 (0.5, 0.34), rx=0.09, ry=0.11
 * - 矩形の建物本体: ドーム下、中央
 * - 左右に崩れた壁
 * - 放射状の鉄骨リブがドーム内で微かに揺れる
 * - 全体に陽炎のような水平方向の sin 歪み
 * - マウス位置に応じてドーム内の明暗が薄く変化
 */
export const dome: MotifFunction = (nx, ny, time, mx, my) => {
  // --- 陽炎（水平方向の微かな歪み） ---
  const heatWave =
    Math.sin(ny * 14 + time * 0.7) * 0.004 +
    Math.sin(ny * 27 - time * 0.5) * 0.0025;
  const x = nx + heatWave;
  const y = ny;

  // 画面外は即 0（軽量化）
  if (y < 0.14 || y > 0.82) return 0;
  if (x < 0.24 || x > 0.76) return 0;

  // --- 基本パーツ ---
  // ドーム上部の楕円
  const domeOuter = sdEllipse(x, y, 0.5, 0.34, 0.095, 0.115);
  // ドーム内側（くり抜き用）— 少し小さい楕円
  const domeInner = sdEllipse(x, y, 0.5, 0.35, 0.07, 0.09);

  // 建物本体（矩形）
  const body = sdBox(x, y, 0.5, 0.55, 0.085, 0.135);

  // 土台（やや広めの矩形）
  const base = sdBox(x, y, 0.5, 0.7, 0.155, 0.025);

  // 崩れた左右の壁（不規則な上端）
  const leftWallTop =
    0.54 + Math.sin(x * 42 + 1.3) * 0.02 + Math.sin(x * 91) * 0.01;
  const leftWall = sdBox(
    x,
    Math.max(y, leftWallTop + 0.001),
    0.34,
    0.68,
    0.055,
    0.12,
  );
  const rightWallTop =
    0.52 + Math.sin(x * 38 - 0.7) * 0.02 + Math.sin(x * 77 + 2.1) * 0.01;
  const rightWall = sdBox(
    x,
    Math.max(y, rightWallTop + 0.001),
    0.66,
    0.69,
    0.05,
    0.115,
  );

  // 建物シルエット（ドーム外殻 + 本体 + 土台 + 左右壁）
  let silhouette = opUnion(domeOuter, body);
  silhouette = opUnion(silhouette, base);
  silhouette = opUnion(silhouette, leftWall);
  silhouette = opUnion(silhouette, rightWall);

  // 基本シルエットの明度
  let brightness = sdfToBrightness(silhouette, 0.012, 6.5);

  /* --- ドーム内部の鉄骨リブ（放射状）--- */
  // ドーム内部（domeInner <= 0）でのみリブを描く
  if (domeInner <= 0.005) {
    // 中心 (0.5, 0.36) からの角度と半径
    const cx = 0.5;
    const cy = 0.36;
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r > 0.005 && dy <= 0.02) {
      const ang = Math.atan2(-dy, dx); // 上向きが正
      // 微かな揺れ（風）
      const sway = Math.sin(time * 0.9 + ang * 3) * 0.06;
      // 8本の放射リブ
      const RIBS = 8;
      let minRib = 1;
      for (let i = 0; i < RIBS; i++) {
        const baseAng = (Math.PI * (i + 0.5)) / RIBS; // 0〜π
        const a = baseAng + sway * 0.03;
        // 中心からの角度差
        let diff = Math.abs(ang - a);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        const ribDist = diff * r;
        if (ribDist < minRib) minRib = ribDist;
      }
      // リブの太さ
      const ribB = sdfToBrightness(minRib - 0.0015, 0.006, 12);
      // ドーム中央寄りほど濃く（中心で交差）
      const centerBoost = 1 - Math.min(1, r / 0.11);
      brightness = Math.max(
        brightness,
        ribB * (0.55 + centerBoost * 0.35),
      );

      // 水平方向の骨組み（2本の弧）
      const arc1 = Math.abs(r - 0.055);
      const arc2 = Math.abs(r - 0.088);
      const arcB =
        sdfToBrightness(Math.min(arc1, arc2) - 0.0015, 0.006, 10) * 0.55;
      brightness = Math.max(brightness, arcB);
    }
  }

  /* --- 建物の窓（暗部として表現）--- */
  // 本体内部で等間隔に小さな明暗パターンを加える
  if (body <= 0) {
    // 2段 x 3列の窓
    const winRows = [0.48, 0.58];
    const winCols = [0.44, 0.5, 0.56];
    let winB = 0;
    for (const ry of winRows) {
      for (const rxp of winCols) {
        const d = sdBox(x, y, rxp, ry, 0.012, 0.022);
        if (d <= 0) {
          // 窓の中心で明度を一段濃く
          winB = Math.max(winB, 0.8 + Math.abs(d) * 10);
        }
      }
    }
    if (winB > 0) brightness = Math.max(brightness, Math.min(1, winB));
  }

  /* --- マウス追従：微かな陰影 --- */
  // mx, my ∈ [0,1]。仮想光源の方向ベクトル
  const lx = (mx - 0.5) * 1.4;
  const ly = (my - 0.5) * 1.4;
  // シルエット内だけで適用
  if (silhouette < 0) {
    // 位置と光源方向の内積で明暗を±10%以内に揺らす
    const dot = (x - 0.5) * lx + (y - 0.5) * ly;
    const shade = 1 + dot * 0.6;
    brightness *= shade;
    if (brightness > 1) brightness = 1;
    if (brightness < 0) brightness = 0;
  }

  /* --- 地面の微かな反射 --- */
  if (y > 0.72 && y < 0.8) {
    // 建物本体の列に対して反転した薄い影
    const mirrorY = 0.72 - (y - 0.72);
    const mirrorBody = sdBox(x, mirrorY + 0.02, 0.5, 0.55, 0.085, 0.135);
    const fade = 1 - (y - 0.72) / 0.08;
    const reflectB = sdfToBrightness(mirrorBody, 0.02, 3) * 0.12 * fade;
    brightness = Math.max(brightness, reflectB);
  }

  // 参照されない可能性を回避（エディタの未使用警告対策）
  void sdCircle;
  void sdSegment;

  return brightness;
};

export default dome;
