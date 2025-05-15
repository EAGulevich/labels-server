import { ReadonlyRoom } from "@sharedTypes/types";

import { DB_ROOMS } from "../db/rooms";

export const getRoomByRoomCode = (
  roomCode: string,
): ReadonlyRoom | undefined => {
  return DB_ROOMS[roomCode];
};
