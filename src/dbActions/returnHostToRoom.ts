import { DB_ROOM_HOSTS } from "../db/roomHosts";
import { DB_ROOMS } from "../db/rooms";

export const returnHostToRoom = ({
  roomCode,
  newHostId,
}: {
  roomCode: string;
  newHostId: string;
}) => {
  const room = DB_ROOMS[roomCode];
  if (room) {
    const oldHostId = room.hostId;
    delete DB_ROOM_HOSTS[oldHostId];
    DB_ROOM_HOSTS[newHostId] = room.code;

    room.isInactive = false;
    room.hostId = newHostId;
  }
};
