import { addNewPlayerToRoom } from "@dbActions/addNewPlayerToRoom";
import { findRoom } from "@dbActions/findRoom";
import { markPlayerActive } from "@dbActions/markPlayerActive";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { validateJoinRoom } from "@socketEvents/onlyPlayer/joinRoom/validate";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerJoinRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("joinRoom", ({ roomCode, player, prevPlayerId }, cb) => {
    logger(`<--- joinRoom`, {
      meta: { socketId: socket.id, roomCode, playerName: player.name },
    });

    const room = findRoom({ findBy: "roomCode", value: roomCode });

    const oldPlayer = room?.players.find((p) => p.id === prevPlayerId);

    if (prevPlayerId && room && oldPlayer) {
      const { markedActivePlayer } = markPlayerActive({
        roomCode: room.code,
        prevPlayerId: prevPlayerId,
        newPlayerId: socket.id,
      });

      if (markedActivePlayer) {
        socket.join(room.code);

        socket.broadcast.in(room.code).emit("playerHasReconnected", {
          room: cloneDeepRoom(room),
          eventData: {
            reconnectedPlayer: cloneDeepPlayer(markedActivePlayer),
          },
        });
        cb({
          data: {
            room: cloneDeepRoom(room),
            eventData: {
              joinedPlayer: markedActivePlayer,
            },
          },
        });
        logger(`---> Player reconnected to room with roomCode=${roomCode}`);
      }
    } else {
      const validationError = validateJoinRoom({ roomCode });

      if (validationError) {
        cb({
          error: validationError,
        });
        logger("---> " + validationError.message);
      } else {
        const { newPlayer } = addNewPlayerToRoom({
          roomCode,
          joiningPlayer: player,
          playerId: socket.id,
        });

        if (!room || !newPlayer) {
          logger("CRASHED", { isError: true });
        } else {
          socket.join(roomCode);

          socket.broadcast.in(roomCode).emit("joinedPlayer", {
            room: cloneDeepRoom(room),
            eventData: { joinedPlayer: newPlayer },
          });

          cb({
            data: {
              room: cloneDeepRoom(room),
              eventData: {
                joinedPlayer: newPlayer,
              },
            },
          });

          logger(`---> Player joined to room with roomCode=${roomCode}`);
        }
      }
    }
  });
};
