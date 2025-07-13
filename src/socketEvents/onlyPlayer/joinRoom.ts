import { SocketType } from "@app";
import { PlayerService } from "@services/player.service";
import { ROOM_STATUSES } from "@shared/types";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerJoinRoom = (socket: SocketType) => {
  socket.on("joinRoom", async ({ roomCode, player }, cb) => {
    try {
      const { room, joinedPlayer } = await PlayerService.joinRoom({
        roomCode,
        player: {
          name: player.name,
          id: socket.data.userId,
        },
      });

      await socket.join(room.code);

      const isNewPlayer = room.status === ROOM_STATUSES.LOBBY;
      if (isNewPlayer) {
        socket.data.userId = joinedPlayer.id;
      }

      cb({
        success: true,
        room,
        extra: {
          userId: joinedPlayer.id,
        },
      });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        outputRoom: room,
        actionName: ">>> joinRoom",
        message: "Игрок успешно вошел в комнату",
      });
    } catch (err) {
      cb({
        success: false,
        error: prettyErr(err),
      });
      sentryLog({
        severity: "error",
        eventFrom: "server",
        message: prettyErr(err).description,
        error: err,
        actionName: ">>> joinRoom",
      });
    }
  });
};
