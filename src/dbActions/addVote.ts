import { sentryLog } from "@utils/logger";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const addVote = ({
  roomCode,
  candidateId,
  playerId,
}: {
  playerId: string;
  roomCode: string;
  candidateId: string;
}): {
  changedRoom?: DeepReadonly<DBRoom>;
  isAllPlayersVotedForFact?: boolean;
} => {
  const room = DB_ROOMS[roomCode];
  const candidate = room?.votingFact?.candidates.find(
    (c) => c.id === candidateId,
  );

  if (!room || !candidate || !room.votingFact) {
    sentryLog({
      severity: "error",
      roomCode,
      eventFrom: "DB",
      actionName: "errorChangingDB",
      changes: [],
      message:
        "Не удалось добавить голос кандидату, т.к. комната, факт для голосования или кандидат не найден",
    });

    return {
      changedRoom: undefined,
      isAllPlayersVotedForFact: undefined,
    };
  }

  const isPlayerAlreadyVoted = room.votingFact.candidates.some((c) =>
    c.votesFromPlayers.includes(playerId),
  );

  if (isPlayerAlreadyVoted) {
    sentryLog({
      severity: "error",
      roomCode,
      eventFrom: "DB",
      actionName: "errorChangingDB",
      changes: [],
      message:
        "Не удалось добавить голос кандидату, т.к. этот игрок уже голосовал",
    });

    return {
      changedRoom: undefined,
      isAllPlayersVotedForFact: undefined,
    };
  }

  candidate.votesFromPlayers.push(playerId);
  sentryLog({
    severity: "info",
    roomCode,
    eventFrom: "DB",
    actionName: "DBChanged",
    changes: [
      {
        fieldName: "candidate.votesFromPlayers",
        newValue: candidate.votesFromPlayers,
      },
    ],
    message: `Добавлен гололс за кандидата [${candidate.name}]`,
  });

  const votesCount = room.votingFact?.candidates.reduce((acc, candidate) => {
    acc += candidate.votesFromPlayers.length;
    return acc;
  }, 0);

  const isAllVoted = room.players.length - 1 === votesCount;

  return {
    changedRoom: room,
    isAllPlayersVotedForFact: isAllVoted,
  };
};
