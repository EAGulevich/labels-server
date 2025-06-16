import { sentryLog } from "@utils/logger";

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

  if (!room) {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      roomCode,
      message:
        "Не удалось назначить факт для голосования, т.к. комната не найдена",
      actionName: "errorChangingDB",
      changes: [],
    });

    return {
      changedRoom: undefined,
    };
  }

  room.votingFact = votingFact;

  sentryLog({
    severity: "info",
    eventFrom: "DB",
    roomCode,
    message: `Назначен новый факт для голосования [${votingFact?.text}]`,
    actionName: "DBChanged",
    changes: [
      {
        fieldName: `DB_ROOMS[${roomCode}].votingFact`,
        newValue: votingFact,
      },
    ],
  });

  return {
    changedRoom: room,
  };
};
