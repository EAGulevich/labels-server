import { io } from "@app";
import { addFact } from "@dbActions/addFact";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerAddFact = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("addFact", ({ text }) => {
    logger(`<--- addFact`, {
      meta: { playerId: socket.id, factText: text },
    });

    const { addedFactToRoom, fromPlayer } = addFact({
      factText: text,
      playerId: socket.id,
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

    logger(`---> addedFact`, {
      meta: {
        socketId: socket.id,
        roomCode: addedFactToRoom?.code,
        factText: text,
      },
    });
  });
};
