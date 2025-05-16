import { io } from "@app";
import { findRoom } from "@dbActions/findRoom";
import { markPlayerInactive } from "@dbActions/markPlayerInactive";
import { removePlayerFromRoom } from "@dbActions/removePlayerFromRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

type PlayerDisconnectProps = {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

export const playerDisconnect = ({ socket }: PlayerDisconnectProps) => {
  const room = findRoom({ findBy: "playerId", value: socket.id });

  logger(`<--- playerDisconnecting`, {
    meta: { roomCode: room?.code, socketId: socket.id },
  });

  if (room) {
    //   в данном случае удаляем, иначе делаем неактивным
    if (room.status === "CREATED") {
      const { removedPlayer, newVipPlayer } = removePlayerFromRoom({
        playerId: socket.id,
        roomCode: room.code,
      });

      if (removedPlayer) {
        io.sockets.in(room.code).emit("disconnectedPlayer", {
          room: cloneDeepRoom(room),
          eventData: { disconnectedPlayer: removedPlayer },
        });

        if (newVipPlayer) {
          io.sockets.in(room.code).emit("updateVipPlayer", {
            room: cloneDeepRoom(room),
            eventData: {
              newVipPlayer: cloneDeepPlayer(newVipPlayer),
            },
          });
        }
      } else {
        logger("CRASHED", { isError: true });
      }
    } else {
      const { markedInactivePlayer, newVipPlayer } = markPlayerInactive({
        roomCode: room.code,
        playerId: socket.id,
      });

      if (markedInactivePlayer) {
        io.sockets.in(room.code).emit("playerLostConnection", {
          room: cloneDeepRoom(room),
          eventData: { markedInactivePlayer },
        });

        if (newVipPlayer) {
          io.sockets.in(room.code).emit("updateVipPlayer", {
            room: cloneDeepRoom(room),
            eventData: {
              newVipPlayer: cloneDeepPlayer(newVipPlayer),
            },
          });
        }
      } else {
        logger("CRASHED", { isError: true });
      }
    }

    logger(`---> Player was inactive`, {
      meta: { roomCode: room.code, socketId: socket.id },
      showDBPlayers: true,
      showDBRooms: true,
      showPlayersInRoom: room.code,
    });
  } else {
    logger("CRASHED", { isError: true });
  }
};
