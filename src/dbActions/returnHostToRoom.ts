import { Changes, sentryLog } from "@utils/logger";

import { DB_HOSTS } from "../db/hosts";
import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const returnHostToRoom = ({
  roomCode,
  newHostId,
}: {
  roomCode: string;
  newHostId: string;
}): { changedRoom: DeepReadonly<DBRoom> | undefined } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    const changes: Changes = [];
    const oldHostId = room.hostId;

    delete DB_HOSTS[oldHostId];
    changes.push({ fieldName: `DB_HOSTS[${oldHostId}]`, newValue: undefined });

    DB_HOSTS[newHostId] = room.code;
    changes.push({ fieldName: `DB_HOSTS[${newHostId}]`, newValue: room.code });

    room.isInactive = false;
    changes.push({
      fieldName: `DB_ROOMS[${roomCode}].isInactive`,
      newValue: false,
    });

    room.hostId = newHostId;

    changes.push({
      fieldName: `DB_ROOMS[${roomCode}].hostId`,
      newValue: newHostId,
    });

    sentryLog({
      severity: "info",
      eventFrom: "DB",
      actionName: "DBChanged",
      roomCode: roomCode,
      message: "Изменен id хоста в комнате",
      changes,
    });
    return {
      changedRoom: room,
    };
  } else {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      actionName: "errorChangingDB",
      roomCode: roomCode,
      message: "Не удалось найти комнату",
      changes: [],
    });
    return { changedRoom: undefined };
  }
};
