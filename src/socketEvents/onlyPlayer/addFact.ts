import { SocketType } from "@app";
import { PlayerService } from "@services/player.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerAddFact = (socket: SocketType) => {
  socket.on("addFact", async (eventInputData, cb) => {
    try {
      await PlayerService.addFact({
        factText: eventInputData.text,
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
        actionName: ">>> addFact",
      });
    }
  });
};
