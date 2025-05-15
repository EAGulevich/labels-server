import { createRoom } from "@dbActions/createRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerCreateRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("createRoom", (data, cb) => {
    logger(`<--- createRoom`, { meta: { socketId: socket.id } });

    const { createdRoom } = createRoom({ roomHostId: socket.id });
    socket.join(createdRoom.code);

    cb({
      room: cloneDeepRoom(createdRoom),
      eventData: {
        newRoomHostId: createdRoom.hostId,
      },
    });

    logger(`---> Room created with roomCode=${createdRoom.code}`, {
      showDBRooms: true,
    });
  });
};
