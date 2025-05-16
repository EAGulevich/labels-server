import { DeepReadonly, Player } from "@sharedTypes/types";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";

export const addNewPlayerToRoom = ({
  joiningPlayer,
  playerId,
  roomCode,
}: {
  roomCode: string;
  playerId: string;
  joiningPlayer: Pick<Player, "name" | "avatarToken">;
}): { newPlayer: DeepReadonly<Player> | undefined } => {
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
    isVip: !room.players.length,
    isActive: true,
  };

  room.players.push(newPlayer);
  DB_PLAYERS[newPlayer.id] = roomCode;

  return {
    newPlayer,
  };
};
