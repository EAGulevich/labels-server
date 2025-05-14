import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { logger } from "@utils/logger";
import { getRoomCodeByHostId } from "@dbActions/getRoomCodeByHostId";
import { getRoomCodeByPlayerId } from "@dbActions/getRoomCodeByPlayerId";
import { getRoomByRoomCode } from "@dbActions/getRoomByRoomCode";
import { changeRoomActive } from "@dbActions/changeRoomActive";
import { removePlayerFromRoom } from "@dbActions/removePlayerFromRoom";
import { disconnectPlayerFromRoom } from "@dbActions/disconnectPlayerFromRoom";

export const registerDisconnectingHostOrPlayer = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("disconnecting", () => {
    logger(`USER DISCONNECTING: ${socket.id}`);
    const hostRoomCode = getRoomCodeByHostId(socket.id);
    const playerRoomCode = getRoomCodeByPlayerId(socket.id);

    if (hostRoomCode) {
      logger(`<--- hostDisconnecting`, {
        meta: { roomCode: hostRoomCode, socketId: socket.id },
      });

      const room = getRoomByRoomCode(hostRoomCode);
      if (room) {
        //   TODO: удалять через X секунд неактивные комнаты
        changeRoomActive({ roomCode: hostRoomCode, isInactive: true });

        socket.broadcast.in(room.code).emit("hostLeftRoom", {
          room,
        });
        logger(`---> Room was inactive ${hostRoomCode}`, {
          showDBRoomHosts: true,
          showDBRooms: true,
        });
      } else {
        logger("CRASHED");
      }
    }

    if (playerRoomCode) {
      logger(`<--- playerDisconnecting`, {
        meta: { roomCode: playerRoomCode, socketId: socket.id },
      });

      const room = getRoomByRoomCode(playerRoomCode);

      if (room) {
        //   в данном случае удаляем, иначе делаем неактивным
        if (room.status === "CREATED") {
          const { removedPlayer } = removePlayerFromRoom({
            playerId: socket.id,
            roomCode: playerRoomCode,
          });

          if (removedPlayer) {
            socket.broadcast.in(room.code).emit("disconnectedPlayer", {
              room: room,
              eventData: { disconnectedPlayer: removedPlayer },
            });
          } else {
            logger("CRASHED");
          }
        } else {
          const { disconnectedPlayer } = disconnectPlayerFromRoom({
            roomCode: playerRoomCode,
            playerId: socket.id,
          });

          if (disconnectedPlayer) {
            socket.broadcast.in(room.code).emit("disconnectedPlayer", {
              room: room,
              eventData: { disconnectedPlayer },
            });
          } else {
            logger("CRASHED");
          }
        }

        logger(`---> Player was inactive`, {
          meta: { roomCode: playerRoomCode, socketId: socket.id },
          showDBPlayers: true,
          showDBRooms: true,
          showPlayersInRoom: room.code,
        });
      }
    }
  });
};
