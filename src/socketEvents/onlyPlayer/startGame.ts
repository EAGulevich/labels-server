import { io } from "@app";
import { findRoom } from "@dbActions/findRoom";
import { startGame } from "@dbActions/startGame";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerStartGame = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("startGame", () => {
    const roomCode = findRoom({ findBy: "playerId", value: socket.id })?.code;

    logger(`<--- startGame`, {
      meta: { socketId: socket.id, roomCode },
    });

    if (roomCode) {
      const { startedRoom } = startGame({ roomCode });

      if (startedRoom) {
        io.sockets.in(roomCode).emit("gameStarted", {
          room: cloneDeepRoom(startedRoom),
        });
      }
    }

    logger(`---> gameStarted`, {
      meta: { socketId: socket.id, roomCode: roomCode },
    });
  });
};
