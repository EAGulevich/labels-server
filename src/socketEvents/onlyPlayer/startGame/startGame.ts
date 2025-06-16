import { io } from "@app";
import {
  ADD_FAKE_FACT_TIMEOUT_MS,
  MIN_PLAYERS,
  UNKNOWN_ROOM_CODE,
} from "@constants";
import { addFact } from "@dbActions/addFact";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { startGame } from "@dbActions/startGame";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { fakeId } from "@utils/fakeId";
import { getRandomElement } from "@utils/getRandomElement";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

import { FAKE_FACTS } from "./fakeFacts";

export const registerStartGame = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("startGame", () => {
    const room = findRoom({ findBy: "playerId", value: socket.id });
    const roomCode = room?.code;

    sentryLog({
      severity: "info",
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      roomCode: roomCode || UNKNOWN_ROOM_CODE,
      actionName: "startGame",
      eventInputData: {
        socketId: socket.id,
      },
      message: "VIP-игрок запустил первый раунд",
    });

    if (!roomCode) {
      sentryLog({
        severity: "error",
        eventFrom: "server",
        roomCode: UNKNOWN_ROOM_CODE,
        actionName: "error",
        message: "Не удалось начать первый раунд, т.к. не найдена комната",
        eventTo: "nobody",
      });
      return;
    }

    if (room?.players.length < MIN_PLAYERS) {
      sentryLog({
        severity: "error",
        eventFrom: "server",
        roomCode: room?.code,
        actionName: "error",
        message:
          "Не удалось начать первый раунд, т.к. игроков меньше минимального",
        eventTo: "nobody",
      });
    }

    const { startedRoom } = startGame({ roomCode });

    if (!startedRoom) {
      sentryLog({
        severity: "error",
        eventFrom: "server",
        roomCode,
        actionName: "error",
        message: "Не удалось начать раунд",
        eventTo: "nobody",
      });
      return;
    }

    io.sockets.in(roomCode).emit("gameStarted", {
      room: cloneDeepRoom(startedRoom),
    });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      roomCode,
      actionName: "gameStarted",
      message: "Начат первый раунд",
      eventTo: "all",
    });

    setTimeout(() => {
      const randomFact = getRandomElement(FAKE_FACTS);

      const { roomWithAddedFact, fromPlayer } = addFact({
        factText: randomFact,
        playerId: fakeId(startedRoom.code),
      });

      if (!roomWithAddedFact) {
        sentryLog({
          severity: "error",
          eventFrom: "server",
          roomCode,
          actionName: "error",
          message: "Не удалось добавить фейковый факт",
          eventTo: "nobody",
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
        roomCode,
        actionName: "playerAddedFact",
        message: `Добавлен фейковый факт [${randomFact}]`,
        eventTo: "all",
      });
    }, ADD_FAKE_FACT_TIMEOUT_MS);
  });
};
