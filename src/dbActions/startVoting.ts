import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const startVoting = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    room.status = ROOM_STATUSES.VOTING;

    return {
      changedRoom: room,
    };
  }

  return {
    changedRoom: undefined,
  };
};
