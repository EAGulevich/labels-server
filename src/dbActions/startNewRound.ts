import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { ROOM_STATUSES } from "@sharedTypes/roomStatuses";
import { shuffleArray } from "@utils/shuffleArray";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const startNewRound = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    room.status = ROOM_STATUSES.ROUND;
    if (room.round === 0) {
      room.facts = shuffleArray(room.facts);
    } else {
      room.facts.forEach((f) => {
        if (f.playerId === f.supposedPlayer?.id) {
          f.isGuessed = true;
          const player = room.players.find((p) => p.id === f.playerId);
          if (player) {
            player.factStatus = FACT_STATUS.GUESSED;
          }
        }
      });
    }

    room.round = room.round + 1;
    room.facts = room.facts.map((f) => {
      f.vote[room.round] = null;
      return f;
    });
    room.votingFact = undefined;

    return {
      changedRoom: room,
    };
  }

  return {
    changedRoom: undefined,
  };
};
