import { sentryLog } from "@utils/logger";
import maxBy from "lodash.maxby";

import { DB_ROOMS } from "../db/rooms";
import { DBCandidate, DBRoom, DeepReadonly } from "../db/types";

export const applyVotesForFact = ({
  roomCode,
}: {
  roomCode: string;
}): { changedRoom?: DeepReadonly<DBRoom> } => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      actionName: "errorChangingDB",
      roomCode,
      message:
        "Не получилось применить результат голосования, т.к. комната не найдена",
      changes: [],
    });

    return {
      changedRoom: undefined,
    };
  }

  const currentVotingFact = room.facts.find(
    (f) => f.id === room.votingFact?.id,
  );

  if (!currentVotingFact) {
    sentryLog({
      severity: "error",
      eventFrom: "DB",
      actionName: "errorChangingDB",
      roomCode,
      message:
        "Не получилось применить результат голосования, т.к. не найден текущий факт в голосовании",
      changes: [],
    });
    return {
      changedRoom: undefined,
    };
  }

  const voteKey: keyof DBCandidate = "votesFromPlayers";

  const playerIdWithMaxVotes = maxBy(
    room.votingFact?.candidates,
    `${voteKey}.length`,
  );

  const isOnlyMax =
    room.votingFact?.candidates.filter(
      (c) =>
        c.votesFromPlayers.length ===
        playerIdWithMaxVotes?.votesFromPlayers.length,
    ).length === 1;

  if (!room.story[room.round]) {
    room.story[room.round] = [];
  }

  if (playerIdWithMaxVotes && isOnlyMax) {
    currentVotingFact.supposedPlayer = playerIdWithMaxVotes;
    currentVotingFact.vote[room.round] = playerIdWithMaxVotes.id;
    room.story[room.round].push(playerIdWithMaxVotes.id);

    sentryLog({
      severity: "info",
      eventFrom: "DB",
      actionName: "DBChanged",
      roomCode,
      message: `Применен результат голосования - выбран кандидат с максимальным числом голосом [${currentVotingFact.supposedPlayer.name}]`,
      changes: [
        {
          fieldName: "currentVotingFact.supposedPlayer",
          newValue: playerIdWithMaxVotes,
        },
        {
          fieldName: "currentVotingFact.vote[room.round]",
          newValue: playerIdWithMaxVotes.id,
        },
        {
          fieldName: "room.story[room.round]",
          newValue: room.story[room.round],
        },
      ],
    });
  } else {
    currentVotingFact.supposedPlayer = null;
    currentVotingFact.vote[room.round] = "NOBODY";
    room.story[room.round].push("NOBODY");

    sentryLog({
      severity: "info",
      eventFrom: "DB",
      actionName: "DBChanged",
      roomCode,
      message:
        "Применен результат голосования - кандидат не выбран, т.к. никто не набрал максимальное кол-во голосов",
      changes: [
        {
          fieldName: "currentVotingFact.supposedPlayer",
          newValue: null,
        },
        {
          fieldName: "currentVotingFact.vote[room.round]",
          newValue: currentVotingFact.vote[room.round],
        },
        {
          fieldName: "room.story[room.round]",
          newValue: room.story[room.round],
        },
      ],
    });
  }

  return {
    changedRoom: room,
  };
};
