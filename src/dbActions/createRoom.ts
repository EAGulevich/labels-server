import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { DeepReadonly, Room } from "@sharedTypes/types";
import { generateRoomCode } from "@utils/generateRoomCode";

import { DB_HOSTS } from "../db/hosts";
import { DB_ROOMS } from "../db/rooms";

export const createRoom = ({
  roomHostId,
}: {
  roomHostId: string;
}): { createdRoom: DeepReadonly<Room> } => {
  const createdRoom: Room = {
    code: generateRoomCode(),
    status: ROOM_STATUSES.CREATED,
    players: [],
    hostId: roomHostId,
    isInactive: false,
  };

  DB_ROOMS[createdRoom.code] = createdRoom;
  DB_HOSTS[createdRoom.hostId] = createdRoom.code;
  return { createdRoom };
};
