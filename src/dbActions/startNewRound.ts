import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { sentryLog } from "@utils/logger";
import { shuffleArray } from "@utils/shuffleArray";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const startNewRound = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      roomCode,
      eventFrom: "DB",
      actionName: "errorChangingDB",
      changes: [],
      message: `Не удалось начать новый раунд, т.к. комната не найдена`,
    });

    return {
      changedRoom: undefined,
    };
  }

  room.status = ROOM_STATUSES.ROUND;
  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    changes: [
      {
        fieldName: "room.status",
        newValue: room.status,
      },
    ],
    message: `Изменен статус комнаты`,
  });

  if (room.round === 0) {
    room.facts = shuffleArray(room.facts);

    sentryLog({
      severity: "info",
      roomCode,
      eventFrom: "DB",
      actionName: "DBChanged",
      changes: [
        {
          fieldName: "room.facts",
          newValue: room.facts,
        },
      ],
      message: `Факты перемешаны перед началом первого раунда`,
    });
  } else {
    room.facts.forEach((f) => {
      if (f.playerId === f.supposedPlayer?.id) {
        f.isGuessed = true;
        sentryLog({
          severity: "info",
          roomCode,
          eventFrom: "DB",
          actionName: "DBChanged",
          changes: [
            {
              fieldName: "fact.isGuessed",
              newValue: f.isGuessed,
            },
          ],
          message: `Факт [${f.text}] отмечен угаданным`,
        });
        const player = room.players.find((p) => p.id === f.playerId);
        if (player) {
          player.factStatus = FACT_STATUS.GUESSED;
          sentryLog({
            severity: "info",
            roomCode,
            eventFrom: "DB",
            actionName: "DBChanged",
            changes: [
              {
                fieldName: "player.factStatus",
                newValue: player.factStatus,
              },
            ],
            message: `Игрок [${player.name}] отмечен угаданным`,
          });
        }
      }
    });
  }

  room.round = room.round + 1;

  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    changes: [
      {
        fieldName: "room.round",
        newValue: room.round,
      },
    ],
    message: `Раунд комнаты изменился на [${room.round}]`,
  });

  room.facts = room.facts.map((f) => {
    f.vote[room.round] = null;
    return f;
  });

  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    changes: [
      {
        fieldName: "room.facts",
        newValue: room.facts,
      },
    ],
    message: `Обнулены голоса для каждого факта`,
  });

  room.votingFact = undefined;

  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    changes: [
      {
        fieldName: "room.votingFact",
        newValue: room.votingFact,
      },
    ],
    message: `Обнулен текущий факт для голосования`,
  });

  return {
    changedRoom: room,
  };
};
