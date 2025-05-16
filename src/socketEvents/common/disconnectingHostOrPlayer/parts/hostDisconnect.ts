import { io } from "@app";
import { changeRoomActive } from "@dbActions/changeRoomActive";
import { findRoom } from "@dbActions/findRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

type HostDisconnectProps = {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

export const hostDisconnect = ({ socket }: HostDisconnectProps) => {
  const room = findRoom({ findBy: "hostId", value: socket.id });

  logger(`<--- hostDisconnecting`, {
    meta: { roomCode: room?.code, socketId: socket.id },
  });

  if (room) {
    // todo later: удалить комнату, если хост не вернулся в нее спустя X секунд
    // + оправить об этом эвент другим подключенным пользователям
    changeRoomActive({ roomCode: room.code, isInactive: true });

    io.sockets.in(room.code).emit("hostLeftRoom", {
      room: cloneDeepRoom(room),
    });
    logger(`---> Room was inactive ${room.code}`, {
      showDBRoomHosts: true,
      showDBRooms: true,
    });
  } else {
    logger("CRASHED", { isError: true });
  }
};
