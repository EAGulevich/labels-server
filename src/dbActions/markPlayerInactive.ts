import { DeepReadonly, Player } from "@sharedTypes/types";

import { DB_ROOMS } from "../db/rooms";

export const markPlayerInactive = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): { markedInactivePlayer?: DeepReadonly<Player> } => {
  // TODO: продумать правильно логику вип
  const room = DB_ROOMS[roomCode];
  if (room) {
    const markedInactivePlayer = room.players.find((p) => p.id === playerId);

    if (markedInactivePlayer) {
      // TODO: убрать у него випа ????
      markedInactivePlayer.isActive = false;

      if (markedInactivePlayer.isVip && room.players.length) {
        // TODO сделать вип активного первого игрока + если таких нет
        room.players[0].isVip = true;
      }
      return {
        markedInactivePlayer,
      };
    } else {
      return { markedInactivePlayer: undefined };
    }
  } else {
    return { markedInactivePlayer: undefined };
  }
};
