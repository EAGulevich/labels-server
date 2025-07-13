import { SocketType } from "@app";
import { PlayerService } from "@services/player.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerAddVote = (socket: SocketType) => {
  socket.on("addVote", async ({ candidateId, factId }, cb) => {
    try {
      const { room } = await PlayerService.addVote({
        voterId: socket.data.userId,
        factId,
        selectedPlayerId: candidateId,
      });

      cb({ success: true, room, extra: { voted: true } });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        message: "Голос принят",
        actionName: ">>> addVote",
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
        actionName: ">>> addVote",
      });
    }
  });
};
