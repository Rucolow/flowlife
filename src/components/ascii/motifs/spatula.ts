import type { MotifFunction } from "./types";
import { sdRoundBox, sdTriangle, sdfToBrightness } from "./sdf";

/* ---------- Okonomiyaki spatulas ---------- */

/**
 * 広島お好み焼きのヘラ（コテ）2枚。交差して置かれている。
 * ヘラは静止。湯気がゆっくり昇る（周期6秒）。
 */
export const spatula: MotifFunction = (nx, ny, time) => {
  const x = nx;
  const y = ny;

  // 鉄板の水平線（最下部）
  let brightness = 0;
  const plateDist = Math.abs(y - 0.88);
  if (plateDist < 0.008) {
    brightness = Math.max(brightness, (1 - plateDist / 0.008) * 0.4);
  }

  /* --- ヘラ1 (右下がり、約 -20°) --- */
  const ang1 = -0.35;
  // 中心 (0.5, 0.65) 周りに逆回転
  const c1x = 0.5;
  const c1y = 0.62;
  const dx1 = x - c1x;
  const dy1 = y - c1y;
  const rx1 = dx1 * Math.cos(-ang1) - dy1 * Math.sin(-ang1);
  const ry1 = dx1 * Math.sin(-ang1) + dy1 * Math.cos(-ang1);
  // 金属部（台形を矩形+三角で近似: 角丸矩形）
  const metal1 = sdRoundBox(rx1, ry1, -0.05, 0, 0.12, 0.035, 0.012);
  brightness = Math.max(brightness, sdfToBrightness(metal1, 0.012, 6));
  // 台形の先端をテーパーさせる（右側に三角を追加）
  const tip1 = sdTriangle(
    rx1, ry1,
    0.07, -0.035,
    0.07, 0.035,
    0.14, 0,
  );
  brightness = Math.max(brightness, sdfToBrightness(tip1, 0.01, 7));
  // 柄（木）
  const handle1 = sdRoundBox(rx1, ry1, -0.2, 0, 0.08, 0.018, 0.01);
  brightness = Math.max(brightness, sdfToBrightness(handle1, 0.01, 7));

  /* --- ヘラ2 (左下がり、約 +20°、上に重なる) --- */
  const ang2 = 0.35;
  const c2x = 0.5;
  const c2y = 0.62;
  const dx2 = x - c2x;
  const dy2 = y - c2y;
  const rx2 = dx2 * Math.cos(-ang2) - dy2 * Math.sin(-ang2);
  const ry2 = dx2 * Math.sin(-ang2) + dy2 * Math.cos(-ang2);
  const metal2 = sdRoundBox(rx2, ry2, -0.05, 0, 0.12, 0.035, 0.012);
  brightness = Math.max(brightness, sdfToBrightness(metal2, 0.012, 6));
  const tip2 = sdTriangle(
    rx2, ry2,
    0.07, -0.035,
    0.07, 0.035,
    0.14, 0,
  );
  brightness = Math.max(brightness, sdfToBrightness(tip2, 0.01, 7));
  const handle2 = sdRoundBox(rx2, ry2, -0.2, 0, 0.08, 0.018, 0.01);
  brightness = Math.max(brightness, sdfToBrightness(handle2, 0.01, 7));

  /* --- 湯気（上方向に昇る sin 曲線を複数）--- */
  // ヘラの上方（y < 0.5 付近）
  if (y < 0.55) {
    // 3本の湯気を別位相で
    const streams = [
      { baseX: 0.38, phase: 0, width: 0.016 },
      { baseX: 0.5, phase: 1.8, width: 0.02 },
      { baseX: 0.62, phase: 3.6, width: 0.016 },
    ];
    for (const s of streams) {
      // 上昇位相: y が上に行くほど時間が進む感じ
      const rise = time * 0.18 + s.phase;
      // 上に行くほど揺れ幅を大きく
      const sway =
        Math.sin(y * 24 + rise * 3) * 0.02 * (1 - y) +
        Math.sin(y * 11 + rise * 2) * 0.012;
      const streamX = s.baseX + sway;
      const dist = Math.abs(x - streamX);
      if (dist < s.width) {
        // 上昇に合わせて濃淡が流れる
        const density =
          0.5 + Math.sin(y * 14 - rise * 4 + s.phase) * 0.5;
        // 上に行くほど薄く、下（ヘラ近く）で濃い
        const heightFade = Math.max(0, (0.55 - y) / 0.45);
        const core = 1 - dist / s.width;
        const b = core * density * heightFade * 0.5;
        brightness = Math.max(brightness, b);
      }
    }
  }

  return Math.min(1, brightness);
};

export default spatula;
