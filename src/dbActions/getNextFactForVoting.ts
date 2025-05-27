import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { shuffleArray } from "@utils/shuffleArray";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const getNextFactForVoting = ({
  roomCode,
}: {
  roomCode: string;
}): {
  votingFact?: DeepReadonly<DBRoom["votingFact"]>;
  isAllFactsHasCandidate?: boolean;
} => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    return {
      votingFact: undefined,
    };
  }

  const unguessedFacts = room.facts.filter(
    (f) => !f.isGuessed && !f.vote[room.round],
  );

  const candidates = room.players.filter(
    (p) =>
      p.factStatus === FACT_STATUS.NOT_GUESSED &&
      !room.facts.find((f) => f.vote[room.round] === p.id),
  );

  const votingFact = shuffleArray(unguessedFacts)[0];

  if (votingFact) {
    return {
      votingFact: {
        id: votingFact.id,
        candidates: candidates.map((c) => ({ ...c, voteCount: 0 })),
        text: votingFact.text,
      },
    };
  } else {
    return {
      votingFact: undefined,
      isAllFactsHasCandidate: true,
    };
  }
};
