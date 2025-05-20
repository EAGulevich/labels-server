import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DeepReadonly } from "../db/types";

export const markPlayerActive = ({
  roomCode,
  prevPlayerId,
  newPlayerId,
}: {
  prevPlayerId: string;
  newPlayerId: string;
  roomCode: string;
}): {
  markedActivePlayer?: DeepReadonly<DBPlayer>;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    return { markedActivePlayer: undefined };
  }

  const markedActivePlayer = room.players.find((p) => p.id === prevPlayerId);

  if (!markedActivePlayer) {
    return { markedActivePlayer: undefined };
  }

  markedActivePlayer.isVip = !room.players.filter(
    (p) => p.isActive && !p.isFake,
  ).length;
  markedActivePlayer.isActive = true;

  markedActivePlayer.id = newPlayerId;

  delete DB_PLAYERS[prevPlayerId];
  DB_PLAYERS[newPlayerId] = roomCode;

  return {
    markedActivePlayer,
  };
};
