import { io } from "@app";
import { addFact } from "@dbActions/addFact";
import { findRoom } from "@dbActions/findRoom";
import { startGame } from "@dbActions/startGame";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { fakeId } from "@utils/fakeId";
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

        setTimeout(() => {
          const { addedFactToRoom, fromPlayer } = addFact({
            // TODO: выбрать рандомный факт
            factText: "TODO",
            playerId: fakeId(startedRoom.code),
          });

          if (addedFactToRoom) {
            io.sockets.in(addedFactToRoom.code).emit("playerAddedFact", {
              room: cloneDeepRoom(addedFactToRoom),
              eventData: {
                fromPlayer: cloneDeepPlayer(fromPlayer),
              },
            });
          } else {
            logger("CRASHED", { isError: true });
          }
        }, 5 * 1000);
      }
    }

    logger(`---> gameStarted`, {
      meta: { socketId: socket.id, roomCode: roomCode },
    });
  });
};
