import { FACT_STATUS } from "@sharedTypes/factStatuses";
import { sentryLog } from "@utils/logger";
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
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message: "Не удалось найти факт для голосования, т.к. комната не найдена",
      roomCode,
    });

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

  if (!votingFact) {
    sentryLog({
      severity: "info",
      actionName: "search",
      eventFrom: "DB",
      changes: [],
      message:
        "Не найден следующий факт для голосования, т.к. у каждого факта назначен кандидат",
      roomCode,
    });

    return {
      votingFact: undefined,
      isAllFactsHasCandidate: true,
    };
  }

  sentryLog({
    severity: "info",
    actionName: "search",
    eventFrom: "DB",
    changes: [],
    message: `Найден следующий факт для голосования "${votingFact.text}"`,
    roomCode,
  });

  return {
    isAllFactsHasCandidate: false,
    votingFact: {
      id: votingFact.id,
      candidates: candidates.map((c) => ({ ...c, votesFromPlayers: [] })),
      text: votingFact.text,
    },
  };
};
