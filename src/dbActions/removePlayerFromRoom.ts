import { sentryLog } from "@utils/logger";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DeepReadonly } from "../db/types";

export const removePlayerFromRoom = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): {
  removedPlayer?: DeepReadonly<DBPlayer>;
  newVipPlayer?: DeepReadonly<DBPlayer>;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Не удалось удалить игрока, т.к. комната не найдена",
      roomCode: roomCode,
    });
    return { removedPlayer: undefined };
  }

  const removingPlayerIndex = room.players.findIndex((p) => p.id === playerId);

  if (removingPlayerIndex === -1) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Не удалось удалить игрока, т.к. он не найден в комнате",
      roomCode: roomCode,
    });

    return { removedPlayer: undefined };
  }

  const removedPlayer = room.players.splice(removingPlayerIndex, 1)[0];
  delete DB_PLAYERS[playerId];
  sentryLog({
    severity: "info",
    actionName: "DBChanged",
    eventFrom: "DB",
    changes: [
      {
        fieldName: `DB_PLAYERS[${playerId}]`,
        newValue: DB_PLAYERS[playerId],
      },
    ],
    message: "Игрок удален из базы DB_PLAYERS",
    roomCode: roomCode,
  });

  if (!removedPlayer.isVip) {
    return {
      removedPlayer,
    };
  }

  const firstActivePlayer = room.players.find((p) => p.isActive);

  if (removedPlayer.isVip && firstActivePlayer) {
    firstActivePlayer.isVip = true;

    sentryLog({
      severity: "info",
      actionName: "DBChanged",
      eventFrom: "DB",
      changes: [
        {
          fieldName: `firstActivePlayer.isVip`,
          newValue: firstActivePlayer.isVip,
        },
      ],
      message: `После удаления игрока [${removedPlayer.name}], игрок [${firstActivePlayer.name}] стал VIP`,
      roomCode: roomCode,
    });
  }

  return {
    removedPlayer,
    newVipPlayer: firstActivePlayer,
  };
};
