import maxBy from "lodash.maxby";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const applyVotesForFact = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    const fact = room.facts.find((f) => f.id === room.votingFact?.id);

    const playerIdWithMaxVotes = maxBy(room.votingFact?.candidates, "votes");

    const isOnlyMax =
      room.votingFact?.candidates.filter(
        (c) => c.voteCount === playerIdWithMaxVotes?.voteCount,
      ).length === 1;

    if (playerIdWithMaxVotes && fact) {
      if (isOnlyMax) {
        fact.supposedPlayer = playerIdWithMaxVotes;
        fact.vote[room.round] = playerIdWithMaxVotes.id;
      } else {
        fact.supposedPlayer = null;
        fact.vote[room.round] = "NOBODY";
      }
    }

    return {
      changedRoom: room,
    };
  }

  return {
    changedRoom: undefined,
  };
};
