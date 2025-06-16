import { UNKNOWN_ROOM_CODE } from "@constants";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerFindRoomByHostId = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("findRoomByHostId", (eventInputData, cb) => {
    const { roomHostId } = eventInputData;
    const room = findRoom({ findBy: "hostId", value: roomHostId });

    sentryLog({
      severity: "info",
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      roomCode: room?.code || UNKNOWN_ROOM_CODE,
      actionName: "findRoomByHostId",
      eventInputData: {
        socketId: socket.id,
      },
      message: "Поиск комнаты по id хоста",
    });

    if (room) {
      cb({ foundedRoom: cloneDeepRoom(room) });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        eventTo: getTypeOfSocket(socket.id),
        roomCode: room.code,
        actionName: ">>> findRoomByHostId",
        message: "Комната найдена",
      });
    } else {
      cb({ foundedRoom: undefined });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        eventTo: getTypeOfSocket(socket.id),
        roomCode: UNKNOWN_ROOM_CODE,
        actionName: ">>> findRoomByHostId",
        message: "Комната не найдена",
      });
    }
  });
};
