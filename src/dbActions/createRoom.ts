import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { generateRoomCode } from "@utils/generateRoomCode";
import { sentryLog } from "@utils/logger";

import { DB_HOSTS } from "../db/hosts";
import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const createRoom = ({
  roomHostId,
}: {
  roomHostId: string;
}): { createdRoom: DeepReadonly<DBRoom> } => {
  const existingRoomCode = DB_HOSTS[roomHostId];
  if (existingRoomCode) {
    delete DB_ROOMS[existingRoomCode];
    delete DB_HOSTS[roomHostId];

    sentryLog({
      severity: "info",
      eventFrom: "DB",
      actionName: "DBChanged",
      roomCode: existingRoomCode,
      message: "Удалена старая комната, т.к. хост создает новую комнату",
      changes: [
        {
          fieldName: `DB_HOSTS[${roomHostId}]`,
          newValue: undefined,
        },

        {
          fieldName: `DB_ROOMS[${existingRoomCode}]`,
          newValue: undefined,
        },
      ],
    });
  }

  const createdRoom: DBRoom = {
    code: generateRoomCode(),
    status: ROOM_STATUSES.CREATED,
    players: [],
    hostId: roomHostId,
    isInactive: false,
    facts: [],
    round: 0,
    story: {},
  };

  DB_ROOMS[createdRoom.code] = createdRoom;
  DB_HOSTS[createdRoom.hostId] = createdRoom.code;

  sentryLog({
    severity: "info",
    eventFrom: "DB",
    actionName: "DBChanged",
    roomCode: createdRoom.code,
    message: `Добавлена новая комната [${createdRoom.code}]`,
    changes: [
      {
        fieldName: `DB_HOSTS[${createdRoom.hostId}]`,
        newValue: DB_HOSTS[createdRoom.hostId],
      },

      {
        fieldName: `DB_ROOMS[${createdRoom.code}]`,
        newValue: DB_ROOMS[createdRoom.code],
      },
    ],
  });

  return { createdRoom };
};
