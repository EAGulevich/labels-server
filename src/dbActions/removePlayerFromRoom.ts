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
  const removingPlayerIndex = room?.players.findIndex((p) => p.id === playerId);

  if (
    removingPlayerIndex === undefined ||
    removingPlayerIndex === -1 ||
    !room
  ) {
    return { removedPlayer: undefined };
  }

  const removedPlayer = room.players.splice(removingPlayerIndex, 1)[0];
  delete DB_PLAYERS[playerId];

  if (removedPlayer.isVip && room.players.length) {
    room.players[0].isVip = true;
  }

  return {
    removedPlayer,
  };
};
