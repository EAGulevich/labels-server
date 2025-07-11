import { SocketType } from "@app";
import { PlayerService } from "@services/player.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerChangeAvatar = (socket: SocketType) => {
  socket.on("changeAvatar", async ({ avatarToken }, cb) => {
    sentryLog({
      actionName: "changeAvatar",
      severity: "info",
      eventFrom: "client",
      message: "Игрок меняет авата",
      userId: socket.data.userId,
      input: { avatarToken },
    });
    try {
      const { room, newAvatarToken } = await PlayerService.changePlayerAvatar({
        playerId: socket.data.userId,
        avatarToken,
      });

      cb({
        success: true,
        room,
        extra: {
          changedAvatar: newAvatarToken,
        },
      });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        message: "Игрок успешно изменил аватар",
        actionName: ">>> changeAvatar",
        outputRoom: room,
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
        actionName: ">>> changeAvatar",
      });
    }
  });
};
