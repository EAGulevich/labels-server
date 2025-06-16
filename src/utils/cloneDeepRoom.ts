import { Candidate, Room, VoteStory } from "@sharedTypes/types";

import { DBRoom, DeepReadonly } from "../db/types";

export const cloneDeepRoom = (room: DeepReadonly<DBRoom>): Room => {
  const votingFact: Room["votingFact"] = room.votingFact
    ? {
        ...room.votingFact,
        candidates: [
          ...room.votingFact.candidates.map(
            ({ votesFromPlayers, ...c }): Candidate => ({
              ...c,
              voteCount: votesFromPlayers.length,
            }),
          ),
        ],
      }
    : room.votingFact;

  const facts = room.facts.map((f) => ({ ...f, vote: { ...(f.vote || {}) } }));

  const story: VoteStory = Object.entries(room.story).reduce(
    (acc, [key, value]): VoteStory => {
      acc[+key] = [...value];
      return acc;
    },
    {} as VoteStory,
  );

  return {
    ...room,
    players: [...room.players],
    votingFact,
    facts,
    story,
  };
};
