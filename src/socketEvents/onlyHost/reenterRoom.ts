import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { logger } from "@utils/logger";
import { returnHostToRoom } from "@dbActions/returnHostToRoom";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";
import { findRoomByHostId } from "@dbActions/findRoomByHostId";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";

export const registerReenterRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("reenterRoom", ({ roomHostId }, cb) => {
    logger(`<--- returnRoom`, { meta: { roomHostId, socketId: socket.id } });

    const foundedRoom = findRoomByHostId({ roomHostId });

    if (!foundedRoom) {
      const message = `---> Not found room with room host id ${roomHostId}`;
      cb({
        error: {
          code: ERROR_CODE.ROOM_NOT_FOUND_BY_HOST_ID_REENTER_ERROR,
          message,
        },
      });
      logger(message, {
        showDBRooms: true,
      });
    } else {
      returnHostToRoom({ roomCode: foundedRoom.code, newHostId: socket.id });
      socket.join(foundedRoom.code);

      socket.broadcast.in(foundedRoom.code).emit("hostReturnedToRoom", {
        room: cloneDeepRoom(foundedRoom),
      });

      cb({
        data: {
          room: cloneDeepRoom(foundedRoom),
          eventData: {
            newRoomHostId: foundedRoom.hostId,
          },
        },
      });

      logger(`---> Host returned to room ${foundedRoom.code}`, {
        showDBRooms: true,
      });
    }
  });
};
