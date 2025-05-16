import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { DeepReadonly, Room } from "@sharedTypes/types";

import { DB_ROOMS } from "../db/rooms";

export const startGame = ({
  roomCode,
}: {
  roomCode: string;
}): { startedRoom?: DeepReadonly<Room> } => {
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
