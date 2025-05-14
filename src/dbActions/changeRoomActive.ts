import { DB_ROOMS } from "../db/rooms";

export const changeRoomActive = ({
  roomCode,
  isInactive,
}: {
  roomCode: string;
  isInactive: boolean;
}): void => {
  const room = DB_ROOMS[roomCode];
  if (room) {
    room.isInactive = isInactive;
  }
};
