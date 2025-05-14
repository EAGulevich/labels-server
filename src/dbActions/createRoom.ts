import { ReadonlyRoom, Room } from "@sharedTypes/types";
import { generateRoomCode } from "@utils/generateRoomCode";
import { DB_ROOMS } from "../db/rooms";
import { DB_ROOM_HOSTS } from "../db/roomHosts";

export const createRoom = ({
  roomHostId,
}: {
  roomHostId: string;
}): { createdRoom: ReadonlyRoom } => {
  const createdRoom: Room = {
    code: generateRoomCode(),
    status: "CREATED",
    players: [],
    hostId: roomHostId,
    isInactive: false,
  };

  DB_ROOMS[createdRoom.code] = createdRoom;
  DB_ROOM_HOSTS[createdRoom.hostId] = createdRoom.code;
  return { createdRoom };
};
