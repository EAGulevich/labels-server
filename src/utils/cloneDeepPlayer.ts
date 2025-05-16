import { DeepReadonly, Player } from "@sharedTypes/types";

export const cloneDeepPlayer = (player: DeepReadonly<Player>): Player => {
  return { ...player };
};
