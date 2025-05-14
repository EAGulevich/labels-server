import { ReadonlyPlayer } from "@sharedTypes/types";
import { DB_ROOMS } from "../db/rooms";
import { DB_PLAYERS } from "../db/players";

export const removePlayerFromRoom = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): { removedPlayer?: ReadonlyPlayer } => {
  const room = DB_ROOMS[roomCode];
  const removedPlayerIndex = room?.players.findIndex((p) => p.id === playerId);

  if (!removedPlayerIndex || !room) {
    return { removedPlayer: undefined };
  }

  const removedPlayer = room.players.splice(removedPlayerIndex, 1)[0];
  delete DB_PLAYERS[playerId];

  if (removedPlayer.isVip && room.players.length) {
    room.players[0].isVip = true;
  }
  return {
    removedPlayer,
  };
};
