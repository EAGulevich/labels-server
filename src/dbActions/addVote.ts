import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const addVote = ({
  roomCode,
  candidateId,
}: {
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

  if (!room || !candidate) {
    return {
      changedRoom: undefined,
      isAllPlayersVotedForFact: undefined,
    };
  }

  candidate.voteCount = candidate.voteCount + 1;

  const votesCount = room.votingFact?.candidates.reduce((acc, candidate) => {
    acc += candidate.voteCount;
    return acc;
  }, 0);

  const isAllVoted = room.players.length - 1 === votesCount;

  return {
    changedRoom: room,
    isAllPlayersVotedForFact: isAllVoted,
  };
};
