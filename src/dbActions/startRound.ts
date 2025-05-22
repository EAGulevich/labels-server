import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { shuffleArray } from "@utils/shuffleArray";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const startRound = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    room.status = ROOM_STATUSES.ROUND;
    room.round = room.round + 1;
    room.facts = shuffleArray(room.facts);

    return {
      changedRoom: room,
    };
  }

  return {
    changedRoom: undefined,
  };
};
