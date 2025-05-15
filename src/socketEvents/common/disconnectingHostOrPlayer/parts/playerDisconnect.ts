import { io } from "@app";
import { disconnectPlayerFromRoom } from "@dbActions/disconnectPlayerFromRoom";
import { findRoom } from "@dbActions/findRoom";
import { removePlayerFromRoom } from "@dbActions/removePlayerFromRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
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
      const { removedPlayer } = removePlayerFromRoom({
        playerId: socket.id,
        roomCode: room.code,
      });

      if (removedPlayer) {
        io.sockets.in(room.code).emit("disconnectedPlayer", {
          room: cloneDeepRoom(room),
          eventData: { disconnectedPlayer: removedPlayer },
        });
      } else {
        logger("CRASHED", { isError: true });
      }
    } else {
      const { disconnectedPlayer } = disconnectPlayerFromRoom({
        roomCode: room.code,
        playerId: socket.id,
      });

      if (disconnectedPlayer) {
        io.sockets.in(room.code).emit("disconnectedPlayer", {
          room: cloneDeepRoom(room),
          eventData: { disconnectedPlayer },
        });
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
