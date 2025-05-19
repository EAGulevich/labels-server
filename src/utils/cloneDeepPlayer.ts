import { Player } from "@sharedTypes/types";

import { DBPlayer, DeepReadonly } from "../db/types";

export const cloneDeepPlayer = (player: DeepReadonly<DBPlayer>): Player => {
  return { ...player };
};
