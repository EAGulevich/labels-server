import { addNewPlayerToRoom } from "@dbActions/addNewPlayerToRoom";
import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { fakeId } from "@utils/fakeId";
import { sentryLog } from "@utils/logger";

import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DBRoom, DeepReadonly } from "../db/types";

export const startGame = ({
  roomCode,
}: {
  roomCode: string;
}): { startedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      roomCode,
      changes: [],
      actionName: "errorChangingDB",
      message: "Не удалось изменить комнату, т.к. она не найдена",
    });
    return {
      startedRoom: undefined,
    };
  }

  const fakePlayer: DBPlayer = {
    id: fakeId(roomCode),
    factStatus: FACT_STATUS.NOT_RECEIVED,
    isVip: false,
    isActive: true,
    name: "Robot",
    avatarToken: "ROBOT_BOT",
    isFake: true,
    isAvatarAutoSelected: true,
  };

  room.status = ROOM_STATUSES.STARTED;
  addNewPlayerToRoom({
    roomCode: roomCode,
    joiningPlayer: fakePlayer,
    playerId: fakePlayer.id,
  });

  sentryLog({
    severity: "info",
    eventFrom: "DB",
    roomCode,
    changes: [
      {
        fieldName: "room.status",
        newValue: room.status,
      },

      { fieldName: "room.players", newValue: room.players },
    ],
    actionName: "DBChanged",
    message: `В комнате изменился статус на [${room.status}] и добавлен фейк`,
  });

  return {
    startedRoom: room,
  };
};
