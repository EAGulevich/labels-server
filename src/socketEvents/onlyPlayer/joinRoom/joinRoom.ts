import { addNewPlayerToRoom } from "@dbActions/addNewPlayerToRoom";
import { findRoom } from "@dbActions/findRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { validateJoinRoom } from "@socketEvents/onlyPlayer/joinRoom/validate";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerJoinRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("joinRoom", ({ roomCode, player }, cb) => {
    logger(`<--- joinRoom`, {
      meta: { socketId: socket.id, roomCode, playerName: player.name },
    });

    const validationError = validateJoinRoom({ roomCode });

    if (validationError) {
      cb({
        error: validationError,
      });
      logger("---> " + validationError.message, {
        showDBRooms: true,
      });
    } else {
      const room = findRoom({ findBy: "roomCode", value: roomCode });

      const { newPlayer } = addNewPlayerToRoom({
        roomCode,
        joiningPlayer: player,
        playerId: socket.id,
      });

      if (!room || !newPlayer) {
        logger("CRASHED", { isError: true });
      } else {
        // TODO: если игрок уже в комнате и пытается войти в нее заново (ВОЗМОЖНО ОН НЕ АКТИВЕН, ЛИБО НА ФРОНТЕ ПОПЫТКА ДВАЖДЫ ВОЙТИ)
        // if (oldRoomCode === roomCode && playerInOldRoom) {
        //   socket.emit('joinedPlayer', {
        //     room: DB_ROOMS[roomCode],
        //     eventData: { joinedPlayer: playerInOldRoom },
        //   });
        //
        //   logger(`Player ${playerInOldRoom.id} already in room ${roomCode}`, {
        //     meta: { roomCode, joinedPlayer },
        //     showDBRooms: true,
        //     showPlayersInRoom: roomCode,
        //     showDBPlayers: true,
        //   });
        // }
        socket.join(roomCode);

        socket.broadcast.in(roomCode).emit("joinedPlayer", {
          room: cloneDeepRoom(room),
          eventData: { joinedPlayer: newPlayer },
        });

        cb({ data: { room: cloneDeepRoom(room) } });

        logger(`---> Player joined to room with roomCode=${roomCode}`, {
          showDBRooms: true,
          showPlayersInRoom: roomCode,
          showDBPlayers: true,
        });
      }
    }
  });
};
