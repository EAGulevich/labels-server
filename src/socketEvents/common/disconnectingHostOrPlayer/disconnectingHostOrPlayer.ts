import { UNKNOWN_ROOM_CODE } from "@constants";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

import { hostDisconnect } from "./parts/hostDisconnect";
import { playerDisconnect } from "./parts/playerDisconnect";

export const registerDisconnectingHostOrPlayer = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("disconnecting", () => {
    const socketType = getTypeOfSocket(socket.id);

    if (socketType === "host") {
      const room = findRoom({ findBy: "hostId", value: socket.id });

      sentryLog({
        severity: "info",
        eventFrom: "client",
        eventFromType: getTypeOfSocket(socket.id),
        message: "Хост отключается",
        eventInputData: {
          socketId: socket.id,
        },
        actionName: "disconnecting",
        roomCode: room?.code || UNKNOWN_ROOM_CODE,
      });

      hostDisconnect({ socket });
    } else if (socketType === "player") {
      const room = findRoom({ findBy: "playerId", value: socket.id });

      sentryLog({
        severity: "info",
        eventFrom: "client",
        eventFromType: getTypeOfSocket(socket.id),
        message: "Игрок отключается",
        eventInputData: {
          socketId: socket.id,
        },
        actionName: "disconnecting",
        roomCode: room?.code || UNKNOWN_ROOM_CODE,
      });

      playerDisconnect({ socket });
    } else {
      sentryLog({
        severity: "info",
        eventFrom: "client",
        eventFromType: getTypeOfSocket(socket.id),
        message: "Пользователь отключается",
        eventInputData: {
          socketId: socket.id,
        },
        actionName: "disconnecting",
        roomCode: UNKNOWN_ROOM_CODE,
      });
    }
  });
};
