import { SocketType } from "@app";
import { HostService } from "@services/host.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerStartVoting = (socket: SocketType) => {
  socket.on("startVoting", async (_, cb) => {
    try {
      await HostService.startVoting({
        hostId: socket.data.userId,
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
        actionName: ">>> startVoting",
      });
    }
  });
};
