import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { Player } from "@sharedTypes/types";
import { v4 } from "uuid";

import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";
import { DBFact, DBRoom, DeepReadonly } from "../db/types";

export const addFact = ({
  factText,
  playerId,
}: {
  factText: string;
  playerId: string;
}):
  | {
      addedFactToRoom: DeepReadonly<DBRoom>;
      fromPlayer: DeepReadonly<Player>;
      isAllFacts: boolean;
    }
  | {
      addedFactToRoom: undefined;
      fromPlayer: undefined;
      isAllFacts?: undefined;
    } => {
  // todo later: если игрок дважды пытается добавить факт о себе
  const roomCode = DB_PLAYERS[playerId];

  if (!roomCode) {
    return { addedFactToRoom: undefined, fromPlayer: undefined };
  } else {
    const room = DB_ROOMS[roomCode];
    const player = room?.players.find((p) => p.id === playerId);

    if (!room || !player) {
      return { addedFactToRoom: undefined, fromPlayer: undefined };
    } else {
      const newFact: DBFact = {
        id: v4(),
        text: factText,
        playerId: playerId,
        isGuessed: false,
        supposedPlayer: null,
      };

      room.facts.push(newFact);
      player.factStatus = FACT_STATUS.NOT_GUESSED;

      const isAllFacts = room.facts.length === room.players.length;

      return {
        addedFactToRoom: room,
        fromPlayer: player,
        isAllFacts,
      };
    }
  }
};
