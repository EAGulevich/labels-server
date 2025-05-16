import { DeepReadonly, Player } from "@sharedTypes/types";

import { DB_ROOMS } from "../db/rooms";

export const markPlayerInactive = ({
  roomCode,
  playerId,
}: {
  playerId: string;
  roomCode: string;
}): {
  markedInactivePlayer?: DeepReadonly<Player>;
  newVipPlayer?: DeepReadonly<Player>;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    return { markedInactivePlayer: undefined };
  }

  const markedInactivePlayer = room.players.find((p) => p.id === playerId);

  if (!markedInactivePlayer) {
    return { markedInactivePlayer: undefined };
  }

  markedInactivePlayer.isActive = false;

  if (!markedInactivePlayer.isVip) {
    return {
      markedInactivePlayer,
    };
  }
  markedInactivePlayer.isVip = false;

  const firstActivePlayer = room.players.find((p) => p.isActive);

  if (firstActivePlayer) {
    firstActivePlayer.isVip = true;
  }
  return {
    markedInactivePlayer,
    newVipPlayer: firstActivePlayer,
  };
};
