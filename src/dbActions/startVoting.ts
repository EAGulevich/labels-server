import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { sentryLog } from "@utils/logger";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const startVoting = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    room.status = ROOM_STATUSES.VOTING;

    sentryLog({
      severity: "info",
      eventFrom: "DB",
      actionName: "DBChanged",
      message: "Изменен статус комнаты",
      roomCode: room.code,
      changes: [
        {
          fieldName: `DB_ROOMS[${roomCode}].status`,
          newValue: ROOM_STATUSES.VOTING,
        },
      ],
    });

    return {
      changedRoom: room,
    };
  } else {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      actionName: "errorChangingDB",
      message: "Не удалось изменить статус комнаты, т.к. комната не найдена",
      roomCode: roomCode,
      changes: [],
    });
    return {
      changedRoom: undefined,
    };
  }
};
