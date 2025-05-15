import { DeepReadonly, Player } from "@sharedTypes/types";

import { DB_ROOMS } from "../db/rooms";

export const disconnectPlayerFromRoom = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): { disconnectedPlayer?: DeepReadonly<Player> } => {
  const room = DB_ROOMS[roomCode];
  if (room) {
    const disconnectedPlayer = room.players.find((p) => p.id === playerId);

    if (disconnectedPlayer) {
      disconnectedPlayer.isPlayerInactive = true;

      if (disconnectedPlayer.isVip && room.players.length) {
        room.players[0].isVip = true;
      }
      return {
        disconnectedPlayer,
      };
    } else {
      return { disconnectedPlayer: undefined };
    }
  } else {
    return { disconnectedPlayer: undefined };
  }
};
