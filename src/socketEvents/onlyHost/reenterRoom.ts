import { UNKNOWN_ROOM_CODE } from "@constants";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { returnHostToRoom } from "@dbActions/returnHostToRoom";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerReenterRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("reenterRoom", (eventInputData, cb) => {
    const { roomHostId } = eventInputData;
    sentryLog({
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      severity: "info",
      message: "Хост перезаходит в комнату",
      roomCode:
        findRoom({ findBy: "hostId", value: roomHostId })?.code ||
        UNKNOWN_ROOM_CODE,
      actionName: "reenterRoom",
      eventInputData: {
        socketId: socket.id,
        ...eventInputData,
      },
    });

    const foundedRoom = findRoom({ findBy: "hostId", value: roomHostId });

    if (!foundedRoom) {
      const message = `Не найдена комната, в которой хост имеет id=${roomHostId}`;
      cb({
        error: {
          code: ERROR_CODE.ROOM_NOT_FOUND_BY_HOST_ID_REENTER_ERROR,
          message,
        },
      });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        eventTo: getTypeOfSocket(socket.id),
        roomCode: UNKNOWN_ROOM_CODE,
        message,
        actionName: ">>> reenterRoom",
      });
    } else {
      const { changedRoom } = returnHostToRoom({
        roomCode: foundedRoom.code,
        newHostId: socket.id,
      });

      if (changedRoom) {
        socket.join(changedRoom.code);

        cb({
          data: {
            room: cloneDeepRoom(foundedRoom),
            eventData: {
              newRoomHostId: foundedRoom.hostId,
            },
          },
        });
        sentryLog({
          severity: "info",
          eventFrom: "server",
          eventTo: getTypeOfSocket(socket.id),
          roomCode: changedRoom.code,
          message: "Хост вернулся в комнату",
          actionName: ">>> reenterRoom",
        });

        socket.broadcast.in(foundedRoom.code).emit("hostReturnedToRoom", {
          room: cloneDeepRoom(foundedRoom),
        });

        sentryLog({
          severity: "info",
          eventFrom: "server",
          eventTo: "players",
          roomCode: changedRoom.code,
          message: "Хост вернулся в комнату",
          actionName: "hostReturnedToRoom",
        });
      } else {
        sentryLog({
          severity: "error",
          eventFrom: "server",
          eventTo: "nobody",
          roomCode: UNKNOWN_ROOM_CODE,
          message: "Не удалось вернуть хоста в комнату",
          actionName: "error",
        });
      }
    }
  });
};
