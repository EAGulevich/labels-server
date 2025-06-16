import { io } from "@app";
import { UNKNOWN_ROOM_CODE } from "@constants";
import { findRoom } from "@dbActions/findRoom";
import { markPlayerInactive } from "@dbActions/markPlayerInactive";
import { removePlayerFromRoom } from "@dbActions/removePlayerFromRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

type PlayerDisconnectProps = {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
};

const removePlayer = ({ socket }: PlayerDisconnectProps) => {
  const room = findRoom({ findBy: "playerId", value: socket.id });

  if (!room) {
    sentryLog({
      severity: "error",
      eventFrom: "server",
      roomCode: UNKNOWN_ROOM_CODE,
      message: "Не удалось найти комнату из которой отключился игрок",
      actionName: "error",
      eventTo: "nobody",
    });
    return;
  }

  const { removedPlayer, newVipPlayer } = removePlayerFromRoom({
    playerId: socket.id,
    roomCode: room.code,
  });

  if (!removedPlayer) {
    sentryLog({
      severity: "error",
      eventFrom: "server",
      roomCode: UNKNOWN_ROOM_CODE,
      message: "Не удалось удалить игрока из комнаты",
      actionName: "error",
      eventTo: "nobody",
    });
    return;
  }

  io.sockets.in(room.code).emit("disconnectedPlayer", {
    room: cloneDeepRoom(room),
    eventData: { disconnectedPlayer: removedPlayer },
  });

  sentryLog({
    severity: "info",
    eventFrom: "server",
    roomCode: room.code,
    message: `Игрок [${removedPlayer.name}] удален из комнаты`,
    actionName: "disconnectedPlayer",
    eventTo: "all",
  });

  if (newVipPlayer) {
    io.sockets.in(room.code).emit("updateVipPlayer", {
      room: cloneDeepRoom(room),
      eventData: {
        newVipPlayer: cloneDeepPlayer(newVipPlayer),
      },
    });
    sentryLog({
      severity: "info",
      eventFrom: "server",
      roomCode: room.code,
      message: `Игрок [${newVipPlayer.name}] стал VIP`,
      actionName: "updateVipPlayer",
      eventTo: "all",
    });
  }
};

const markInactivePlayer = ({ socket }: PlayerDisconnectProps) => {
  const room = findRoom({ findBy: "playerId", value: socket.id });

  if (!room) {
    sentryLog({
      severity: "error",
      eventFrom: "server",
      roomCode: UNKNOWN_ROOM_CODE,
      message: "Не удалось найти комнату из которой отключился игрок",
      actionName: "error",
      eventTo: "nobody",
    });
    return;
  }

  const { markedInactivePlayer, newVipPlayer } = markPlayerInactive({
    roomCode: room.code,
    playerId: socket.id,
  });

  if (!markedInactivePlayer) {
    sentryLog({
      severity: "error",
      eventFrom: "server",
      roomCode: UNKNOWN_ROOM_CODE,
      message: "Не удалось сделать игрока неактивным",
      actionName: "error",
      eventTo: "nobody",
    });

    return;
  }

  io.sockets.in(room.code).emit("playerLostConnection", {
    room: cloneDeepRoom(room),
    eventData: { markedInactivePlayer },
  });

  sentryLog({
    severity: "info",
    eventFrom: "server",
    roomCode: room.code,
    message: `Игрок [${markedInactivePlayer.name}] потерял соединение`,
    actionName: "playerLostConnection",
    eventTo: "all",
  });

  if (newVipPlayer) {
    io.sockets.in(room.code).emit("updateVipPlayer", {
      room: cloneDeepRoom(room),
      eventData: {
        newVipPlayer: cloneDeepPlayer(newVipPlayer),
      },
    });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      roomCode: room.code,
      message: `Игрок [${newVipPlayer.name}] стал VIP`,
      actionName: "updateVipPlayer",
      eventTo: "all",
    });
  }
};

export const playerDisconnect = ({ socket }: PlayerDisconnectProps) => {
  const room = findRoom({ findBy: "playerId", value: socket.id });

  if (!room) {
    sentryLog({
      severity: "error",
      eventFrom: "server",
      roomCode: UNKNOWN_ROOM_CODE,
      message: "Не удалось найти комнату из которой отключился игрок",
      actionName: "error",
      eventTo: "nobody",
    });
    return;
  }

  if (room.status === "CREATED") {
    removePlayer({ socket });
  } else {
    markInactivePlayer({ socket });
  }
};
