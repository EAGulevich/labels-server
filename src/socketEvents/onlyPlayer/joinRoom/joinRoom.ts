import { addNewPlayerToRoom } from "@dbActions/addNewPlayerToRoom";
import { findRoom } from "@dbActions/findRoom";
import { getTypeOfSocket } from "@dbActions/getTypeOfSocket";
import { markPlayerActive } from "@dbActions/markPlayerActive";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { validateJoinRoom } from "@socketEvents/onlyPlayer/joinRoom/validate";
import { cloneDeepPlayer } from "@utils/cloneDeepPlayer";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { sentryLog } from "@utils/logger";
import { Socket } from "socket.io";

export const registerJoinRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("joinRoom", (eventInputData, cb) => {
    const { roomCode, player, prevPlayerId } = eventInputData;
    const room = findRoom({ findBy: "roomCode", value: roomCode });

    sentryLog({
      severity: "info",
      eventFrom: "client",
      actionName: "joinRoom",
      roomCode,
      eventInputData: { ...eventInputData, socketId: socket.id },
      message: `Игрок [${player.name}] присоединяется к комнате`,
      eventFromType: prevPlayerId ? getTypeOfSocket(prevPlayerId) : "unknown",
    });

    const oldPlayer = room?.players.find((p) => p.id === prevPlayerId);

    if (prevPlayerId && room && oldPlayer) {
      const { markedActivePlayer } = markPlayerActive({
        roomCode: room.code,
        prevPlayerId: prevPlayerId,
        newPlayerId: socket.id,
      });

      if (markedActivePlayer) {
        socket.join(room.code);

        cb({
          data: {
            room: cloneDeepRoom(room),
            eventData: {
              joinedPlayer: markedActivePlayer,
            },
          },
        });
        sentryLog({
          severity: "info",
          eventFrom: "server",
          actionName: ">>> joinRoom",
          roomCode,
          message: `Игрок [${markedActivePlayer.name}] переподключился`,
          eventTo: "player",
        });

        socket.broadcast.in(room.code).emit("playerHasReconnected", {
          room: cloneDeepRoom(room),
          eventData: {
            reconnectedPlayer: cloneDeepPlayer(markedActivePlayer),
          },
        });

        sentryLog({
          severity: "info",
          eventFrom: "server",
          actionName: "playerHasReconnected",
          roomCode,
          message: `Игрок [${markedActivePlayer.name}] переподключился`,
          eventTo: `all except ${markedActivePlayer.name}`,
        });
      }
    } else {
      const validationError = validateJoinRoom({
        roomCode,
        playerName: player.name,
      });

      if (validationError) {
        cb({
          error: validationError,
        });
        sentryLog({
          severity: "info",
          eventFrom: "server",
          actionName: ">>> joinRoom",
          roomCode,
          message: `Игрок [${player.name}] не может подключиться к комнате. Reason: ${validationError.message}`,
          eventTo: "player",
        });
        return;
      }

      const { newPlayer } = addNewPlayerToRoom({
        roomCode,
        joiningPlayer: { ...player, isFake: false },
        playerId: socket.id,
      });

      if (!room || !newPlayer) {
        sentryLog({
          severity: "error",
          eventFrom: "server",
          actionName: "error",
          roomCode,
          message: `Игрок [${player.name}] не может подключиться к комнате, т.к. не удалось его добавить`,
          eventTo: "player",
        });
      } else {
        socket.join(roomCode);

        cb({
          data: {
            room: cloneDeepRoom(room),
            eventData: {
              joinedPlayer: newPlayer,
            },
          },
        });

        sentryLog({
          severity: "info",
          eventFrom: "server",
          actionName: ">>> joinRoom",
          roomCode,
          message: `Игрок [${player.name}] подключился к комнате`,
          eventTo: "player",
        });

        socket.broadcast.in(roomCode).emit("joinedPlayer", {
          room: cloneDeepRoom(room),
          eventData: { joinedPlayer: newPlayer },
        });

        sentryLog({
          severity: "info",
          eventFrom: "server",
          actionName: "joinedPlayer",
          roomCode,
          message: `Игрок [${player.name}] подключился к комнате`,
          eventTo: `all except ${socket.id}`,
        });
      }
    }
  });
};
