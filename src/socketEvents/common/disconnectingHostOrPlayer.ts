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
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { io } from "@app";

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
        // TODO: + добавить обработку эвента с сервера, что комната удалена, т.к. хост не переподключился
        changeRoomActive({ roomCode: hostRoomCode, isInactive: true });

        io.sockets.in(room.code).emit("hostLeftRoom", {
          room: cloneDeepRoom(room),
        });
        logger(`---> Room was inactive ${hostRoomCode}`, {
          showDBRoomHosts: true,
          showDBRooms: true,
        });
      } else {
        logger("CRASHED", { isError: true });
      }
    } else if (playerRoomCode) {
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
            io.sockets.in(room.code).emit("disconnectedPlayer", {
              room: cloneDeepRoom(room),
              eventData: { disconnectedPlayer: removedPlayer },
            });
          } else {
            logger("CRASHED", { isError: true });
          }
        } else {
          const { disconnectedPlayer } = disconnectPlayerFromRoom({
            roomCode: playerRoomCode,
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
          meta: { roomCode: playerRoomCode, socketId: socket.id },
          showDBPlayers: true,
          showDBRooms: true,
          showPlayersInRoom: room.code,
        });
      } else {
        logger("CRASHED", { isError: true });
      }
    }
  });
};
