import { sentryLog } from "@utils/logger";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DeepReadonly } from "../db/types";

export const markPlayerActive = ({
  roomCode,
  prevPlayerId,
  newPlayerId,
}: {
  prevPlayerId: string;
  newPlayerId: string;
  roomCode: string;
}): {
  markedActivePlayer?: DeepReadonly<DBPlayer>;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      roomCode,
      eventFrom: "DB",
      actionName: "errorChangingDB",
      changes: [],
      message:
        "Не удалось пометить игрока активным, т.к. не найдена комната с этим игроком",
    });

    return { markedActivePlayer: undefined };
  }

  const markedActivePlayer = room.players.find((p) => p.id === prevPlayerId);

  if (!markedActivePlayer) {
    sentryLog({
      severity: "error",
      roomCode,
      eventFrom: "DB",
      actionName: "errorChangingDB",
      changes: [],
      message: `Не удалось пометить игрока активным, т.к. не найден игрок с предыдущим id=${prevPlayerId}`,
    });
    return { markedActivePlayer: undefined };
  }

  const isActivePlayerVip = !room.players.filter(
    (p) => (p.isActive && !p.isFake) || p.isVip,
  ).length;

  if (markedActivePlayer.isVip !== isActivePlayerVip) {
    markedActivePlayer.isVip = isActivePlayerVip;
    sentryLog({
      severity: "info",
      roomCode,
      eventFrom: "DB",
      actionName: "DBChanged",
      changes: [
        {
          fieldName: "room.player.isVip",
          newValue: isActivePlayerVip,
        },
      ],
      message: `Игрок [${markedActivePlayer.name}] стал VIP`,
    });
  }

  markedActivePlayer.isActive = true;
  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    changes: [
      {
        fieldName: "markedActivePlayer.name",
        newValue: true,
      },
    ],
    message: `Новый активный игрок [${markedActivePlayer.name}] стал VIP`,
  });

  markedActivePlayer.id = newPlayerId;
  delete DB_PLAYERS[prevPlayerId];
  DB_PLAYERS[newPlayerId] = roomCode;
  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    message: "Удален старый id игрока и назначен новый",
    changes: [
      {
        fieldName: "markedActivePlayer.id",
        newValue: newPlayerId,
      },
      {
        fieldName: `DB_PLAYERS$[${prevPlayerId}]`,
        newValue: undefined,
      },
      {
        fieldName: `DB_PLAYERS$[${newPlayerId}]`,
        newValue: roomCode,
      },
    ],
  });

  room.facts.forEach((fact) => {
    if (fact.supposedPlayer?.id === prevPlayerId) {
      fact.supposedPlayer.id = newPlayerId;
      sentryLog({
        severity: "info",
        roomCode,
        eventFrom: "DB",
        actionName: "DBChanged",
        message: "Изменен id кандидата на новый id игрока",
        changes: [
          {
            fieldName: "fact.supposedPlayer.id",
            newValue: newPlayerId,
          },
        ],
      });
    }

    if (fact.playerId === prevPlayerId) {
      fact.playerId = newPlayerId;
      sentryLog({
        severity: "info",
        roomCode,
        eventFrom: "DB",
        actionName: "DBChanged",
        message: "Изменен id автора факта на новый id игрока",
        changes: [
          {
            fieldName: "fact.playerId",
            newValue: newPlayerId,
          },
        ],
      });
    }

    Object.entries(fact.vote).forEach(([key, val]) => {
      if (val === prevPlayerId) {
        fact.vote[+key] = newPlayerId;
        sentryLog({
          severity: "info",
          roomCode,
          eventFrom: "DB",
          actionName: "DBChanged",
          message: `Изменен id кандидата в истории голосования на новый id игрока`,
          changes: [
            {
              fieldName: `fact.vote[${key}]`,
              newValue: newPlayerId,
            },
          ],
        });
      }
    });
  });

  room.votingFact?.candidates.forEach((candidate) => {
    if (candidate.id === prevPlayerId) {
      candidate.id = newPlayerId;
      sentryLog({
        severity: "info",
        roomCode,
        eventFrom: "DB",
        actionName: "DBChanged",
        message: `Изменен id кандидата в текущем факте для голосования на новый id игрока`,
        changes: [
          {
            fieldName: `room.votingFact.candidate.id`,
            newValue: newPlayerId,
          },
        ],
      });
    }
  });

  return {
    markedActivePlayer,
  };
};
