import { SocketType } from "@app";
import { PlayerService } from "@services/player.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerStartGame = (socket: SocketType) => {
  socket.on("startGame", async (_, cb) => {
    sentryLog({
      actionName: "startGame",
      severity: "info",
      eventFrom: "client",
      message: "Игрок запрашивает начать игру",
      userId: socket.data.userId,
    });
    try {
      await PlayerService.startGame({
        playerId: socket.data.userId,
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
        actionName: ">>> startGame",
      });
    }
  });
};
