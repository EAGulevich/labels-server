import { MAX_PLAYERS } from "@constants";
import { addNewPlayerToRoom } from "@dbActions/addNewPlayerToRoom";
import { getRoomByRoomCode } from "@dbActions/getRoomByRoomCode";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
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

    const room = getRoomByRoomCode(roomCode);
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

    if (!room) {
      const message = `---> Not joined to room, because room with roomCode ${roomCode} not found`;
      cb({
        error: {
          code: ERROR_CODE.ROOM_NOT_FOUND_JOIN_ERROR,
          message,
        },
      });
      logger(message, {
        showDBRooms: true,
      });
    } else if (room.status !== "CREATED") {
      const message = `---> Not joined to room, because room status is ${room.status}`;
      cb({
        error: {
          code: ERROR_CODE.GAME_ALREADY_STARTED_JOIN_ERROR,
          message,
        },
      });
      logger(message, {
        showDBRooms: true,
      });
    } else if (room.players.length === MAX_PLAYERS) {
      const message = `---> Not joined to room, because there is max number of players in the room ${room.code}`;
      cb({
        error: {
          code: ERROR_CODE.MAX_ROOM_CAPACITY_JOIN_ERROR,
          message,
        },
      });
      logger(message, {
        showDBRooms: true,
      });
    } else {
      const { newPlayer } = addNewPlayerToRoom({
        roomCode,
        joiningPlayer: player,
        playerId: socket.id,
      });

      if (newPlayer) {
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
      } else {
        logger("CRASHED", { isError: true });
      }
    }
  });
};
