import { DeepReadonly, Player } from "@sharedTypes/types";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";

export const markPlayerActive = ({
  roomCode,
  prevPlayerId,
  newPlayerId,
}: {
  prevPlayerId: string;
  newPlayerId: string;
  roomCode: string;
}): {
  markedActivePlayer?: DeepReadonly<Player>;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    return { markedActivePlayer: undefined };
  }

  const markedActivePlayer = room.players.find((p) => p.id === prevPlayerId);

  if (!markedActivePlayer) {
    return { markedActivePlayer: undefined };
  }

  markedActivePlayer.isActive = true;
  markedActivePlayer.isVip = !room.players.filter((p) => p.isActive).length;
  markedActivePlayer.id = newPlayerId;

  delete DB_PLAYERS[prevPlayerId];
  DB_PLAYERS[newPlayerId] = roomCode;

  return {
    markedActivePlayer,
  };
};
