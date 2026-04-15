/**
 * Signed Distance Function パーツ集。各モチーフから共有する。
 *
 * - 戻り値 d <= 0: 形の内側（|d| が大きいほど中心に近い）
 * - 戻り値 d >  0: 形の外側（d が小さいほどエッジに近い）
 */

export function sdCircle(
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

export function sdEllipse(
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

export function sdBox(
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

/** 角丸矩形 */
export function sdRoundBox(
  px: number,
  py: number,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  r: number,
): number {
  return sdBox(px, py, cx, cy, Math.max(hw - r, 0), Math.max(hh - r, 0)) - r;
}

export function sdSegment(
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
  const denom = bax * bax + bay * bay || 1e-6;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / denom));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy) - thickness;
}

/**
 * 三角形 SDF（符号つき）。内側で負、外側で正。頂点 a, b, c の順序は
 * 時計回り/反時計回りのどちらでもよい。
 */
export function sdTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): number {
  const e0x = bx - ax;
  const e0y = by - ay;
  const e1x = cx - bx;
  const e1y = cy - by;
  const e2x = ax - cx;
  const e2y = ay - cy;

  const v0x = px - ax;
  const v0y = py - ay;
  const v1x = px - bx;
  const v1y = py - by;
  const v2x = px - cx;
  const v2y = py - cy;

  const h0 = Math.max(0, Math.min(1, (v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y || 1e-6)));
  const h1 = Math.max(0, Math.min(1, (v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y || 1e-6)));
  const h2 = Math.max(0, Math.min(1, (v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y || 1e-6)));

  const p0x = v0x - e0x * h0;
  const p0y = v0y - e0y * h0;
  const p1x = v1x - e1x * h1;
  const p1y = v1y - e1y * h1;
  const p2x = v2x - e2x * h2;
  const p2y = v2y - e2y * h2;

  const d0 = p0x * p0x + p0y * p0y;
  const d1 = p1x * p1x + p1y * p1y;
  const d2 = p2x * p2x + p2y * p2y;

  const s = Math.sign(e0x * e2y - e0y * e2x) || 1;
  const sd = Math.min(
    s * (v0x * e0y - v0y * e0x),
    s * (v1x * e1y - v1y * e1x),
    s * (v2x * e2y - v2y * e2x),
  );
  return -Math.sqrt(Math.min(d0, d1, d2)) * Math.sign(sd || 1);
}

/**
 * SDFの距離値を明度(0-1)に変換する。
 * - d > edge       : 0 （形の外）
 * - 0 < d <= edge  : 0〜0.45 のシャープなエッジ帯
 * - d <= 0         : 0.55〜0.95 の内部（中心ほど濃い）
 *
 * 目的: エッジは薄くぼかすのではなく「形の輪郭」として即座に見せ、
 * 内部は最初から十分明るい値域を使って骨格が読み取れるようにする。
 */
export function sdfToBrightness(
  d: number,
  edge: number,
  depthScale: number,
): number {
  if (d > edge) return 0;
  if (d > 0) return (1 - d / edge) * 0.45;
  return Math.min(0.95, 0.55 + Math.abs(d) * depthScale * 0.5);
}

export function opUnion(a: number, b: number): number {
  return Math.min(a, b);
}

export function opSubtract(a: number, b: number): number {
  return Math.max(a, -b);
}
