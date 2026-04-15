import type { MotifFunction } from "./types";
import { crane } from "./crane";
import { torii } from "./torii";
import { flame } from "./flame";
import { dome } from "./dome";
import { tram } from "./tram";
import { deer } from "./deer";
import { maple } from "./maple";
import { oyster } from "./oyster";
import { bridge } from "./bridge";
import { spatula } from "./spatula";
import { ferry } from "./ferry";

/**
 * モチーフ名 → 関数のマップ。
 *
 * 未実装のモチーフ（tram, deer, maple, oyster, bridge, spatula, ferry）は
 * 現段階では crane.ts をフォールバックとして返す。
 */
const IMPLEMENTED_MOTIFS: Record<string, MotifFunction> = {
  dome,
  crane,
  torii,
  flame,
};

// 未実装のモチーフは crane を返す（後続ステップで差し替え）
const MOTIFS: Record<string, MotifFunction> = {
  dome,
  crane,
  torii,
  flame,
  tram: isImplemented(tram) ? tram : crane,
  deer: isImplemented(deer) ? deer : crane,
  maple: isImplemented(maple) ? maple : crane,
  oyster: isImplemented(oyster) ? oyster : crane,
  bridge: isImplemented(bridge) ? bridge : crane,
  spatula: isImplemented(spatula) ? spatula : crane,
  ferry: isImplemented(ferry) ? ferry : crane,
};

/**
 * 関数の返り値が常に 0 の「プレースホルダ」かどうかを判定する。
 * 未実装モチーフは () => 0 になっているため、数点サンプリングして判定する。
 */
function isImplemented(fn: MotifFunction): boolean {
  for (let i = 0; i < 8; i++) {
    const v = fn(Math.random(), Math.random(), i * 0.3, 0.5, 0.5);
    if (v > 0) return true;
  }
  return false;
}

export function getMotif(name: string): MotifFunction {
  return MOTIFS[name] ?? crane;
}

export { IMPLEMENTED_MOTIFS };
