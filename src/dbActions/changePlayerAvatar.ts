import { Player } from "@sharedTypes/types";
import { sentryLog } from "@utils/logger";

import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DBRoom, DeepReadonly } from "../db/types";

export const changePlayerAvatar = ({
  roomCode,
  playerId,
  avatarToken,
}: {
  roomCode: string;
  playerId: string;
  avatarToken: Player["avatarToken"];
}): {
  changedRoom?: DeepReadonly<DBRoom>;
  updatedPlayer?: DeepReadonly<DBPlayer>;
} => {
  const room = DB_ROOMS[roomCode];
  const player = room?.players.find((p) => p.id === playerId);

  if (!room || !player) {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      roomCode,
      changes: [],
      actionName: "errorChangingDB",
      message:
        "Не удалось изменить аватар игрока, т.к. комната или игрок не найден",
    });
    return {
      changedRoom: undefined,
    };
  }

  player.avatarToken = avatarToken;
  player.isAvatarAutoSelected = false;

  sentryLog({
    severity: "info",
    eventFrom: "DB",
    roomCode,
    changes: [
      {
        fieldName: `player.avatarToken`,
        newValue: avatarToken,
      },
      {
        fieldName: `player.isAvatarAutoSelected`,
        newValue: false,
      },
    ],
    actionName: "DBChanged",
    message: `Игрок [${player.name}] изменил аватар на [${avatarToken}]`,
  });

  return {
    changedRoom: room,
    updatedPlayer: player,
  };
};
