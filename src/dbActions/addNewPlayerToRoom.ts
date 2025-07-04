import { AvatarToken } from "@sharedTypes/avatarTokens";
import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { Player } from "@sharedTypes/types";
import { fakeId } from "@utils/fakeId";
import { getRandomElement } from "@utils/getRandomElement";
import { sentryLog } from "@utils/logger";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DeepReadonly } from "../db/types";

export const addNewPlayerToRoom = ({
  joiningPlayer,
  playerId,
  roomCode,
}: {
  roomCode: string;
  playerId: string;
  joiningPlayer: Pick<Player, "name" | "isFake">;
}): { newPlayer: DeepReadonly<DBPlayer> | undefined } => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Не удалось добавить игрока в комнату, т.к. комната не найдена",
      roomCode,
    });

    return { newPlayer: undefined };
  }

  const checkIfAlreadyInRoom = room.players.some((p) => p.id === playerId);

  if (checkIfAlreadyInRoom) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Игрок не добавлен в комнату, т.к. игрок уже в этой комнате",
      roomCode,
    });
    return { newPlayer: undefined };
  }

  const unusedAvatars = Object.values(AvatarToken).filter(
    (val) => !room.players.some((p) => p.avatarToken === val),
  );

  const newPlayer: Player = {
    ...joiningPlayer,
    id: playerId,
    isVip: !room.players.filter((p) => p.isActive).length,
    isActive: true,
    factStatus: FACT_STATUS.NOT_RECEIVED,
    avatarToken:
      playerId === fakeId(room.code)
        ? "ROBOT_BOT"
        : getRandomElement(unusedAvatars),
    isAvatarAutoSelected: true,
  };

  room.players.push(newPlayer);
  DB_PLAYERS[newPlayer.id] = roomCode;

  sentryLog({
    severity: "info",
    actionName: "DBChanged",
    eventFrom: "DB",
    changes: [
      {
        fieldName: "room.players",
        newValue: room.players,
      },
      {
        fieldName: `DB_PLAYERS[${newPlayer.id}]`,
        newValue: roomCode,
      },
    ],
    message: `Игрок [${newPlayer.name}] добавлен в комнату`,
    roomCode,
  });

  return {
    newPlayer,
  };
};
