import { io } from "@app";
import { UNKNOWN_ROOM_CODE } from "@constants";
import { findRoom } from "@dbActions/findRoom";
import { getNextFactForVoting } from "@dbActions/getNextFactForVoting";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { setVotingFact } from "@dbActions/setVotingFact";
import { startVoting } from "@dbActions/startVoting";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { LogDataType, sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

const ERROR_LOG_DATA_NOT_FOUND_ROOM: LogDataType = {
  severity: "error",
  actionName: "error",
  roomCode: UNKNOWN_ROOM_CODE,
  eventFrom: "server",
  message: "Комната не найдена",
  eventTo: "nobody",
};

export const registerStartVoting = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("startVoting", () => {
    const foundedRoom = findRoom({
      findBy: "hostId",
      value: socket.id,
    });

    sentryLog({
      severity: "info",
      actionName: "startVoting",
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      message: "Начать голосование",
      eventInputData: { socketId: socket.id },
      roomCode: foundedRoom?.code || UNKNOWN_ROOM_CODE,
    });

    if (!foundedRoom) {
      sentryLog(ERROR_LOG_DATA_NOT_FOUND_ROOM);
      return;
    }
    const { changedRoom: startedVotingRoom } = startVoting({
      roomCode: foundedRoom.code,
    });

    if (!startedVotingRoom) {
      sentryLog({
        ...ERROR_LOG_DATA_NOT_FOUND_ROOM,
        message: "Не удалось начать голосование, т.к. комната не найдена",
      });
      return;
    }

    const { votingFact } = getNextFactForVoting({
      roomCode: startedVotingRoom.code,
    });

    if (!votingFact) {
      sentryLog({
        ...ERROR_LOG_DATA_NOT_FOUND_ROOM,
        message: "Не удалось получить факт для голосования",
      });
      return;
    }

    const { changedRoom } = setVotingFact({
      roomCode: startedVotingRoom.code,
      votingFact: {
        ...votingFact,
        candidates: [
          ...votingFact.candidates.map((c) => ({
            ...c,
            votesFromPlayers: [...c.votesFromPlayers],
          })),
        ],
      },
    });

    if (!changedRoom) {
      sentryLog({
        ...ERROR_LOG_DATA_NOT_FOUND_ROOM,
        message:
          "Не возращена измененная комната, в которой установили факт для голосования",
      });
      return;
    }

    io.to(changedRoom.code).emit("voting", {
      room: cloneDeepRoom(changedRoom),
    });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      actionName: "voting",
      eventTo: "all",
      message: `Установлен факт для голосования [${changedRoom.votingFact?.text}]`,
      roomCode: changedRoom.code,
    });
  });
};
