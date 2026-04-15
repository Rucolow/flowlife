import type { MotifFunction } from "./types";
import { dome } from "./dome";
import { crane } from "./crane";
import { tram } from "./tram";
import { torii } from "./torii";
import { deer } from "./deer";
import { maple } from "./maple";
import { oyster } from "./oyster";
import { bridge } from "./bridge";
import { flame } from "./flame";
import { spatula } from "./spatula";
import { ferry } from "./ferry";

/** モチーフ名 → 関数のマップ。 */
export const MOTIFS: Record<string, MotifFunction> = {
  dome,
  crane,
  tram,
  torii,
  deer,
  maple,
  oyster,
  bridge,
  flame,
  spatula,
  ferry,
};

export function getMotif(name: string): MotifFunction {
  return MOTIFS[name] ?? crane;
}
