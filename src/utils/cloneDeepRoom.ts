import { Room } from "@sharedTypes/types";

import { DBRoom, DeepReadonly } from "../db/types";

export const cloneDeepRoom = (room: DeepReadonly<DBRoom>): Room => {
  const votingFact = room.votingFact
    ? {
        ...room.votingFact,
        candidates: [...room.votingFact.candidates],
      }
    : room.votingFact;

  const facts = room.facts.map((f) => ({ ...f, vote: { ...(f.vote || {}) } }));

  return {
    ...room,
    players: [...room.players],
    votingFact,
    facts,
    // TODO json
    story: JSON.parse(JSON.stringify(room.story)),
  };
};
