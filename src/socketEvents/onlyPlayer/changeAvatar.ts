import { io } from "@app";
import { UNKNOWN_ROOM_CODE } from "@constants";
import { changePlayerAvatar } from "@dbActions/changePlayerAvatar";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerChangeAvatar = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("changeAvatar", ({ avatarToken }, cb) => {
    const room = findRoom({ findBy: "playerId", value: socket.id });

    sentryLog({
      severity: "info",
      eventFrom: "client",
      eventFromType: getTypeOfSocket(socket.id),
      roomCode: room?.code || UNKNOWN_ROOM_CODE,
      actionName: "changeAvatar",
      eventInputData: {
        socketId: socket.id,
        avatarToken,
      },
      message: `Игрок изменяет аватар на [${avatarToken}]`,
    });

    if (!room) {
      sentryLog({
        severity: "error",
        eventFrom: "server",
        roomCode: UNKNOWN_ROOM_CODE,
        actionName: "error",
        message: `Не удалось изменить аватар игрока [${avatarToken}], т.к. комната не найдена`,
        eventTo: "nobody",
      });
      return;
    }

    if (
      room?.players.some(
        (p) => p.avatarToken === avatarToken && p.id !== socket.id,
      )
    ) {
      cb({
        error: {
          code: ERROR_CODE.CHANGE_AVATAR_ALREADY_USED_ERROR,
          message: "Не удалось изменить аватар, т.к. он занят другим игроком",
        },
      });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        roomCode: room.code,
        actionName: ">>> changeAvatar",
        message: `Не удалось изменить аватар игрока [${avatarToken}], т.к. аватар уже занят`,
        eventTo: "player",
      });

      return;
    }

    const { changedRoom, updatedPlayer } = changePlayerAvatar({
      roomCode: room.code,
      playerId: socket.id,
      avatarToken,
    });

    if (!changedRoom || !updatedPlayer) {
      sentryLog({
        severity: "error",
        eventFrom: "server",
        roomCode: room.code,
        actionName: "error",
        message: "Не удалось изменить аватар игрока",
        eventTo: "nobody",
      });
      return;
    }

    cb({
      data: {
        room: cloneDeepRoom(changedRoom),
        eventData: {
          changedAvatar: avatarToken,
        },
      },
    });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      roomCode: room.code,
      actionName: "playerChangedAvatar",
      message: `Аватар успешно изменен`,
      eventTo: `player`,
    });

    io.sockets
      .in(room.code)
      .except(socket.id)
      .emit("playerChangedAvatar", {
        room: cloneDeepRoom(changedRoom),
        eventData: {
          updatedPlayer: cloneDeepPlayer(updatedPlayer),
        },
      });

    sentryLog({
      severity: "info",
      eventFrom: "server",
      roomCode: room.code,
      actionName: "playerChangedAvatar",
      message: `Игрок [${updatedPlayer.name}] изменил аватар на [${updatedPlayer.avatarToken}]`,
      eventTo: `all except ${socket.id}`,
    });
  });
};
