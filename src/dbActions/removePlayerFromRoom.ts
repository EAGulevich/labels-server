import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBPlayer, DeepReadonly } from "../db/types";

export const removePlayerFromRoom = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): {
  removedPlayer?: DeepReadonly<DBPlayer>;
  newVipPlayer?: DeepReadonly<DBPlayer>;
} => {
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

  if (!removedPlayer.isVip) {
    return {
      removedPlayer,
    };
  }

  const firstActivePlayer = room.players.find((p) => p.isActive);

  if (removedPlayer.isVip && firstActivePlayer) {
    firstActivePlayer.isVip = true;
  }

  return {
    removedPlayer,
    newVipPlayer: firstActivePlayer,
  };
};
