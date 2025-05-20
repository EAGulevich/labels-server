import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { Player } from "@sharedTypes/types";

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
  joiningPlayer: Pick<Player, "name" | "avatarToken" | "isFake">;
}): { newPlayer: DeepReadonly<DBPlayer> | undefined } => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    return { newPlayer: undefined };
  }

  const checkIfAlreadyInRoom = room.players.some((p) => p.id === playerId);

  if (checkIfAlreadyInRoom) {
    return { newPlayer: undefined };
  }

  const newPlayer: Player = {
    ...joiningPlayer,
    id: playerId,
    isVip: !room.players.filter((p) => p.isActive).length,
    isActive: true,
    factStatus: FACT_STATUS.NOT_RECEIVED,
  };

  room.players.push(newPlayer);
  DB_PLAYERS[newPlayer.id] = roomCode;

  return {
    newPlayer,
  };
};
