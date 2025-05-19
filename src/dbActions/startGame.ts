import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const startGame = ({
  roomCode,
}: {
  roomCode: string;
}): { startedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    room.status = ROOM_STATUSES.STARTED;
    return {
      startedRoom: room,
    };
  }

  return {
    startedRoom: undefined,
  };
};
