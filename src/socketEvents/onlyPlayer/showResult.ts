import { SocketType } from "@app";
import { PlayerService } from "@services/player.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerShowResult = (socket: SocketType) => {
  socket.on("showResult", async (_, cb) => {
    try {
      await PlayerService.showResults({
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
        actionName: ">>> showResult",
      });
    }
  });
};
