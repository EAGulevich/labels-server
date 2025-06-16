import { io } from "@app";
import { UNKNOWN_ROOM_CODE } from "@constants";
import { changeRoomActive } from "@dbActions/changeRoomActive";
import { findRoom } from "@dbActions/findRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

type HostDisconnectProps = {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

export const hostDisconnect = ({ socket }: HostDisconnectProps) => {
  const room = findRoom({ findBy: "hostId", value: socket.id });

  if (!room) {
    sentryLog({
      severity: "error",
      actionName: "error",
      eventFrom: "server",
      eventTo: "nobody",
      roomCode: UNKNOWN_ROOM_CODE,
      message:
        "Не удалось оповестить игроков о дисконнекте хоста, т.к. комната не найдена",
    });
    return;
  }

  changeRoomActive({ roomCode: room.code, isInactive: true });

  io.sockets.in(room.code).emit("hostLeftRoom", {
    room: cloneDeepRoom(room),
  });
  sentryLog({
    severity: "info",
    actionName: "hostLeftRoom",
    eventFrom: "server",
    eventTo: "all",
    roomCode: room.code,
    message: "Хост покинул комнату",
  });
};
