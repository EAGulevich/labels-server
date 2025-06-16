import { sentryLog } from "@utils/logger";

import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DeepReadonly } from "../db/types";

export const markPlayerInactive = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): {
  markedInactivePlayer?: DeepReadonly<DBPlayer>;
  newVipPlayer?: DeepReadonly<DBPlayer>;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message:
        "Не удалось изменить статус активности игрока, т.к. комната не найдена",
      roomCode: roomCode,
    });
    return { markedInactivePlayer: undefined };
  }

  const markedInactivePlayer = room.players.find((p) => p.id === playerId);

  if (!markedInactivePlayer) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message:
        "Не удалось изменить статус активности игрока, т.к. игрок не найден",
      roomCode: roomCode,
    });
    return { markedInactivePlayer: undefined };
  }

  markedInactivePlayer.isActive = false;
  sentryLog({
    severity: "info",
    actionName: "DBChanged",
    eventFrom: "DB",
    changes: [
      {
        fieldName: "markedInactivePlayer.isActive",
        newValue: markedInactivePlayer.isActive,
      },
    ],
    message: `Игрок [${markedInactivePlayer.name}] стал неактивным`,
    roomCode: roomCode,
  });

  if (!markedInactivePlayer.isVip) {
    return {
      markedInactivePlayer,
    };
  }
  markedInactivePlayer.isVip = false;

  const firstActivePlayer = room.players.find((p) => p.isActive && !p.isFake);

  if (firstActivePlayer) {
    firstActivePlayer.isVip = true;

    sentryLog({
      severity: "info",
      actionName: "DBChanged",
      eventFrom: "DB",
      changes: [
        {
          fieldName: "firstActivePlayer.isVip",
          newValue: firstActivePlayer.isVip,
        },
      ],
      message: `Игрок [${firstActivePlayer.name}] стал VIP`,
      roomCode: roomCode,
    });

    return {
      markedInactivePlayer,
      newVipPlayer: firstActivePlayer,
    };
  } else {
    return {
      markedInactivePlayer,
    };
  }
};
