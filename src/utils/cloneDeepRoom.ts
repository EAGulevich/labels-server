import { Room } from "@sharedTypes/types";

import { DBRoom, DeepReadonly } from "../db/types";

export const cloneDeepRoom = (room: DeepReadonly<DBRoom>): Room => {
  return { ...room, players: [...room.players] };
};
