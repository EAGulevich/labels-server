import { io } from "@app";
import { START_NEW_ROUND_TIMEOUT_MS, UNKNOWN_ROOM_CODE } from "@constants";
import { addFact } from "@dbActions/addFact";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { startNewRound } from "@dbActions/startNewRound";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerAddFact = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("addFact", (eventInputData) => {
    const { text } = eventInputData;
    sentryLog({
      severity: "info",
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      roomCode:
        findRoom({ findBy: "playerId", value: socket.id })?.code ||
        UNKNOWN_ROOM_CODE,
      actionName: "addFact",
      message: `Игрок добавляет факт о себе: [${text}]`,
      eventInputData: {
        socketId: socket.id,
        ...eventInputData,
      },
    });

    const { roomWithAddedFact, fromPlayer, isAllFacts } = addFact({
      factText: text,
      playerId: socket.id,
    });

    if (!roomWithAddedFact) {
      sentryLog({
        severity: "error",
        eventFrom: "server",
        eventTo: "nobody",
        roomCode: UNKNOWN_ROOM_CODE,
        message: "Не удалось добавить факт",
        actionName: "error",
      });
      return;
    }

    io.sockets.in(roomWithAddedFact.code).emit("playerAddedFact", {
      room: cloneDeepRoom(roomWithAddedFact),
      eventData: {
        fromPlayer: cloneDeepPlayer(fromPlayer),
      },
    });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      eventTo: "all",
      roomCode: roomWithAddedFact.code,
      message: "Добавлен новый факт",
      actionName: "playerAddedFact",
    });

    if (isAllFacts) {
      setTimeout(() => {
        const { changedRoom } = startNewRound({
          roomCode: roomWithAddedFact.code,
        });

        if (!changedRoom) {
          sentryLog({
            severity: "error",
            eventFrom: "server",
            eventTo: "nobody",
            roomCode: UNKNOWN_ROOM_CODE,
            message:
              "Не удалось начать новый раунд после того, как все факты получены",
            actionName: "error",
          });
          return;
        }

        io.sockets.in(roomWithAddedFact.code).emit("newRoundStarted", {
          room: cloneDeepRoom(changedRoom),
        });

        sentryLog({
          severity: "info",
          eventFrom: "server",
          eventTo: "all",
          roomCode: changedRoom.code,
          message: "Начат новый раунд",
          actionName: "newRoundStarted",
        });
      }, START_NEW_ROUND_TIMEOUT_MS);
    }
  });
};
