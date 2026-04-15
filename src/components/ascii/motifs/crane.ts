import type { MotifFunction } from "./types";
import { sdSegment, sdTriangle, sdfToBrightness } from "./sdf";

/* ---------- Origami crane ---------- */

/**
 * 折り鶴を斜め上から見たシルエット。横幅キャンバスの 70% を使う。
 *
 * レイアウト（休止状態）:
 *   胴体（菱形）      : 中心 (0.5, 0.5), 半幅 0.10, 半高 0.07
 *   首 + 頭           : 胴体右上から (0.78, 0.36) へ
 *   嘴               : (0.86, 0.34) へ短く伸びる
 *   尾                : 胴体左下から (0.18, 0.62) へ
 *   左翼              : 胴体 → (0.10, 0.30) の三角
 *   右翼              : 胴体 → (0.90, 0.28) の三角
 *
 * 動き:
 *   - 周期 4.5s で羽ばたき（翼の y が ±0.06）
 *   - 周期 15s 程度で吊り下げ感のある左右揺れ
 */
export const crane: MotifFunction = (nx, ny, time) => {
  const sway = Math.sin(time * 0.4) * 0.012;
  const x = nx - sway;
  const y = ny;

  if (y < 0.18 || y > 0.78) return 0;

  // 羽ばたき（-1〜+1）
  const flap = Math.sin(time * ((2 * Math.PI) / 4.5));
  // 翼の中心ベース y。羽ばたきで上下する
  const wingBaseY = 0.5 + flap * 0.04;
  // 翼先の y 移動量
  const wingTipDy = -0.18 + flap * 0.06;

  /* --- 胴体（大きめの菱形）--- */
  const bodyCX = 0.5;
  const bodyCY = 0.5 + flap * 0.012;
  const bdx = x - bodyCX;
  const bdy = y - bodyCY;
  // 菱形 SDF: |x|/a + |y|/b - 1
  const diamondNorm = Math.abs(bdx) / 0.10 + Math.abs(bdy) / 0.07 - 1;
  const body = diamondNorm * 0.07;

  /* --- 首 + 頭（右上に伸びる）--- */
  const neck = sdSegment(x, y, 0.55, 0.46, 0.76, 0.36, 0.018);
  const headTri = sdTriangle(x, y, 0.74, 0.32, 0.83, 0.36, 0.76, 0.4);
  const beak = sdSegment(x, y, 0.83, 0.36, 0.92, 0.34, 0.005);

  /* --- 尾（左下に伸びる三角）--- */
  const tail = sdTriangle(x, y, 0.45, 0.5, 0.18, 0.66, 0.42, 0.6);

  /* --- 左翼（大きく広がる三角）--- */
  const lwTipX = 0.10;
  const lwTipY = wingBaseY + wingTipDy;
  const leftWing = sdTriangle(
    x, y,
    0.5, wingBaseY,
    lwTipX, lwTipY,
    0.42, wingBaseY + 0.06,
  );

  /* --- 右翼 --- */
  const rwTipX = 0.90;
  const rwTipY = wingBaseY + wingTipDy * 0.9;
  const rightWing = sdTriangle(
    x, y,
    0.5, wingBaseY,
    rwTipX, rwTipY,
    0.58, wingBaseY + 0.06,
  );

  /* --- 合成 --- */
  let d = body;
  d = Math.min(d, neck);
  d = Math.min(d, headTri);
  d = Math.min(d, beak);
  d = Math.min(d, tail);
  d = Math.min(d, leftWing);
  d = Math.min(d, rightWing);

  let b = sdfToBrightness(d);

  /* --- 翼の折り目（明部の線で強調）--- */
  if (leftWing <= 0.005) {
    const fold = sdSegment(x, y, 0.5, wingBaseY, lwTipX + 0.06, lwTipY + 0.07, 0.003);
    if (fold < 0.003) b = Math.max(b, 0.85);
  }
  if (rightWing <= 0.005) {
    const fold = sdSegment(x, y, 0.5, wingBaseY, rwTipX - 0.06, rwTipY + 0.07, 0.003);
    if (fold < 0.003) b = Math.max(b, 0.85);
  }

  return b;
};

export default crane;
