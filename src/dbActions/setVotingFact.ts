import { DB_ROOMS } from "../db/rooms";
import { DBRoom, DeepReadonly } from "../db/types";

export const setVotingFact = ({
  roomCode,
  votingFact,
}: {
  roomCode: string;
  votingFact: DBRoom["votingFact"];
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (room) {
    room.votingFact = votingFact;

    return {
      changedRoom: room,
    };
  }

  return {
    changedRoom: undefined,
  };
};
