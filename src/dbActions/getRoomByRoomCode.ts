import { DB_ROOMS } from "../db/rooms";
import { ReadonlyRoom } from "@sharedTypes/types";

export const getRoomByRoomCode = (
  roomCode: string,
): ReadonlyRoom | undefined => {
  return DB_ROOMS[roomCode];
};
