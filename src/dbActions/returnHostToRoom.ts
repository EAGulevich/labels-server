import { DB_HOSTS } from "../db/hosts";
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
    delete DB_HOSTS[oldHostId];
    DB_HOSTS[newHostId] = room.code;

    room.isInactive = false;
    room.hostId = newHostId;
  }
};
