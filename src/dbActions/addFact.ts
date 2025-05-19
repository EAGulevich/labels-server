import { FACT_STATUS } from "@sharedTypes/factStatuses";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBFact, DBRoom, DeepReadonly } from "../db/types";

export const addFact = ({
  factText,
  playerId,
}: {
  factText: string;
  playerId: string;
}): {
  addedFactToRoom?: DeepReadonly<DBRoom>;
} => {
  // todo later: если игрок дважды пытается добавить факт о себе
  const roomCode = DB_PLAYERS[playerId];

  if (!roomCode) {
    return { addedFactToRoom: undefined };
  } else {
    const room = DB_ROOMS[roomCode];
    const player = room?.players.find((p) => p.id === playerId);

    if (!room || !player) {
      return { addedFactToRoom: undefined };
    } else {
      const newFact: DBFact = {
        text: factText,
        playerId: playerId,
        isGuessed: false,
      };

      room.facts.push(newFact);
      player.factStatus = FACT_STATUS.NOT_GUESSED;

      return {
        addedFactToRoom: room,
      };
    }
  }
};
