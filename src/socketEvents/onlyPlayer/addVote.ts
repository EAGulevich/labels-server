import { io } from "@app";
import { START_NEW_ROUND_TIMEOUT_MS, UNKNOWN_ROOM_CODE } from "@constants";
import { addVote } from "@dbActions/addVote";
import { applyVotesForFact } from "@dbActions/applyVotesForFact";
import { findRoom } from "@dbActions/findRoom";
import { getNextFactForVoting } from "@dbActions/getNextFactForVoting";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { setVotingFact } from "@dbActions/setVotingFact";
import { startNewRound } from "@dbActions/startNewRound";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerAddVote = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("addVote", (eventInputData) => {
    const { candidateId } = eventInputData;
    const room = findRoom({ findBy: "playerId", value: socket.id });

    sentryLog({
      severity: "info",
      eventFrom: "client",
      roomCode: room?.code || UNKNOWN_ROOM_CODE,
      actionName: "addVote",
      eventFromType: getTypeOfSocket(socket.id),
      eventInputData: {
        socketId: socket.id,
        ...eventInputData,
      },
      message: "Добавление голоса в опросе",
    });

    if (!room) {
      sentryLog({
        severity: "error",
        roomCode: UNKNOWN_ROOM_CODE,
        eventFrom: "server",
        actionName: "error",
        eventTo: "nobody",
        message: `Не удалось отдать голос за факт, т.к. комната не найдена`,
      });
      return;
    }

    const { changedRoom, isAllPlayersVotedForFact } = addVote({
      roomCode: room.code,
      candidateId,
      playerId: socket.id,
    });

    if (!changedRoom) {
      sentryLog({
        severity: "error",
        roomCode: room.code,
        eventFrom: "server",
        actionName: "error",
        eventTo: "nobody",
        message: `Не удалось отдать голос за факт, т.к. не удалось применить изменения в комнате`,
      });
      return;
    }

    io.to(room.code).emit("voting", {
      room: cloneDeepRoom(changedRoom),
    });

    sentryLog({
      severity: "info",
      roomCode: room.code,
      eventFrom: "server",
      actionName: "voting",
      eventTo: "all",
      message: `Отдан голос за факт`,
    });

    if (!isAllPlayersVotedForFact) {
      // ожидаем получения остальных голосов
      return;
    }

    const { changedRoom: roomWithAppliedVoting } = applyVotesForFact({
      roomCode: changedRoom.code,
    });

    if (!roomWithAppliedVoting) {
      sentryLog({
        severity: "error",
        roomCode: changedRoom.code,
        eventFrom: "server",
        actionName: "error",
        eventTo: "nobody",
        message: `Не удалось применить результат голосования`,
      });
      return;
    }

    setTimeout(() => {
      const { votingFact: nextVotingFact, isAllFactsHasCandidate } =
        getNextFactForVoting({
          roomCode: roomWithAppliedVoting.code,
        });

      if (isAllFactsHasCandidate) {
        const { changedRoom: changedRoomForNewRound } = startNewRound({
          roomCode: room.code,
        });

        if (!changedRoomForNewRound) {
          sentryLog({
            severity: "error",
            roomCode: roomWithAppliedVoting.code,
            eventFrom: "server",
            actionName: "error",
            eventTo: "nobody",
            message: `Не удалось начать новый раунд после применения результатов голосования`,
          });
          return;
        }

        io.to(room.code).emit("newRoundStarted", {
          room: cloneDeepRoom(changedRoomForNewRound),
        });

        sentryLog({
          severity: "info",
          roomCode: changedRoomForNewRound.code,
          eventFrom: "server",
          actionName: "newRoundStarted",
          eventTo: "all",
          message: `Начат новый раунд после применения всех результатов голосования`,
        });
        return;
      }

      if (nextVotingFact) {
        const { changedRoom: changedRoomWithNewFact } = setVotingFact({
          roomCode: room.code,
          votingFact: {
            ...nextVotingFact,
            candidates: [
              ...nextVotingFact.candidates.map((c) => ({
                ...c,
                votesFromPlayers: [...c.votesFromPlayers],
              })),
            ],
          },
        });

        if (!changedRoomWithNewFact) {
          sentryLog({
            severity: "error",
            roomCode: roomWithAppliedVoting.code,
            eventFrom: "server",
            actionName: "error",
            eventTo: "nobody",
            message: `Не удалось перейти к новому факту в голосовании`,
          });
          return;
        }

        io.to(room.code).emit("voting", {
          room: cloneDeepRoom(changedRoomWithNewFact),
        });

        sentryLog({
          severity: "info",
          roomCode: changedRoomWithNewFact.code,
          eventFrom: "server",
          actionName: "voting",
          eventTo: "all",
          message: `Назначен новый факт для голосования [${changedRoomWithNewFact.votingFact?.text}]`,
        });
      }
    }, START_NEW_ROUND_TIMEOUT_MS);
  });
};
