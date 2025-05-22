import { addNewPlayerToRoom } from "@dbActions/addNewPlayerToRoom";
import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { fakeId } from "@utils/fakeId";

import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DBRoom, DeepReadonly } from "../db/types";

export const startGame = ({
  roomCode,
}: {
  roomCode: string;
}): { startedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  const fakePlayer: DBPlayer = {
    id: fakeId(roomCode),
    factStatus: FACT_STATUS.NOT_RECEIVED,
    isVip: false,
    isActive: true,
    name: "Robot",
    avatarToken: "ROBOT_BOT",
    isFake: true,
  };

  if (room) {
    room.status = ROOM_STATUSES.STARTED;
    addNewPlayerToRoom({
      roomCode: roomCode,
      joiningPlayer: fakePlayer,
      playerId: fakePlayer.id,
    });
    return {
      startedRoom: room,
    };
  }

  return {
    startedRoom: undefined,
  };
};
