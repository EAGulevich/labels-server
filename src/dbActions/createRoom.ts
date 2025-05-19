import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { generateRoomCode } from "@utils/generateRoomCode";

import { DB_HOSTS } from "../db/hosts";
import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const createRoom = ({
  roomHostId,
}: {
  roomHostId: string;
}): { createdRoom: DeepReadonly<DBRoom> } => {
  const createdRoom: DBRoom = {
    code: generateRoomCode(),
    status: ROOM_STATUSES.CREATED,
    players: [],
    hostId: roomHostId,
    isInactive: false,
    facts: [],
  };

  DB_ROOMS[createdRoom.code] = createdRoom;
  DB_HOSTS[createdRoom.hostId] = createdRoom.code;
  return { createdRoom };
};
