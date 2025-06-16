import { UNKNOWN_ROOM_CODE } from "@constants";
import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { Player } from "@sharedTypes/types";
import { sentryLog } from "@utils/logger";
import { v4 } from "uuid";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBFact, DBRoom, DeepReadonly } from "../db/types";

export const addFact = ({
  factText,
  playerId,
}: {
  factText: string;
  playerId: string;
}):
  | {
      roomWithAddedFact: DeepReadonly<DBRoom>;
      fromPlayer: DeepReadonly<Player>;
      isAllFacts: boolean;
    }
  | {
      roomWithAddedFact: undefined;
      fromPlayer: undefined;
      isAllFacts?: undefined;
    } => {
  const roomCode = DB_PLAYERS[playerId];
  const room = DB_ROOMS[roomCode || ""];
  const player = room?.players.find((p) => p.id === playerId);

  if (!roomCode || !room || !player) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Не удалось добавить факт, т.к. комната или игрок не найден",
      roomCode: roomCode || UNKNOWN_ROOM_CODE,
    });

    return { roomWithAddedFact: undefined, fromPlayer: undefined };
  }

  if (player.factStatus !== FACT_STATUS.NOT_RECEIVED) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Не удалось добавить факт, т.к. игрок уже отправлял свой факт",
      roomCode: roomCode || UNKNOWN_ROOM_CODE,
    });
    return { roomWithAddedFact: undefined, fromPlayer: undefined };
  }

  const newFact: DBFact = {
    id: v4(),
    text: factText,
    playerId: playerId,
    isGuessed: false,
    supposedPlayer: null,
    vote: {
      0: "NOBODY",
    },
  };

  room.facts.push(newFact);
  player.factStatus = FACT_STATUS.NOT_GUESSED;

  sentryLog({
    severity: "info",
    actionName: "DBChanged",
    eventFrom: "DB",
    changes: [
      {
        fieldName: "room.facts",
        newValue: room.facts,
      },
      { fieldName: "player.factStatus", newValue: player.factStatus },
    ],
    message: `Добавлен новый факт [${newFact.text}] игроком [${player.name}]`,
    roomCode,
  });

  const isAllFacts = room.facts.length === room.players.length;

  return {
    roomWithAddedFact: room,
    fromPlayer: player,
    isAllFacts,
  };
};
