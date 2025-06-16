import { UNKNOWN_ROOM_CODE } from "@constants";
import { createRoom } from "@dbActions/createRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerCreateRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("createRoom", (_, cb) => {
    sentryLog({
      severity: "info",
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      actionName: "createRoom",
      eventInputData: { socketId: socket.id },
      roomCode: UNKNOWN_ROOM_CODE,
      message: "Создание комнаты",
    });

    const { createdRoom } = createRoom({ roomHostId: socket.id });
    socket.join(createdRoom.code);

    cb({
      room: cloneDeepRoom(createdRoom),
      eventData: {
        newRoomHostId: createdRoom.hostId,
      },
    });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      eventTo: getTypeOfSocket(socket.id),
      roomCode: createdRoom.code,
      message: `Комната создана ${createdRoom.code}`,
      actionName: ">>> createRoom",
    });
  });
};
