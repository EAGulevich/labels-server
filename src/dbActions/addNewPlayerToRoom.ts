import { Player, ReadonlyPlayer } from "@sharedTypes/types";
import { DB_ROOMS } from "../db/rooms";
import { DB_PLAYERS } from "../db/players";

export const addNewPlayerToRoom = ({
  joiningPlayer,
  playerId,
  roomCode,
}: {
  roomCode: string;
  playerId: string;
  joiningPlayer: Pick<Player, "name" | "avatarToken">;
}): { newPlayer: ReadonlyPlayer | undefined } => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    return { newPlayer: undefined };
  }

  const newPlayer: Player = {
    ...joiningPlayer,
    id: playerId,
    isVip: !room.players.length,
  };

  room.players.push(newPlayer);
  DB_PLAYERS[newPlayer.id] = roomCode;

  return {
    newPlayer,
  };
};
