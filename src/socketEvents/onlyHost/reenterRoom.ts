import { SocketType } from "@app";
import { HostService } from "@services/host.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerReenterRoom = (socket: SocketType) => {
  socket.on("reenterRoom", async (_, cb) => {
    try {
      const { room } = await HostService.reenterRoom({
        hostId: socket.data.userId,
      });

      await socket.join(room.code);

      cb({
        success: true,
        room,
      });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        message: "Хост успешно перезашел в комнату",
        outputRoom: room,
        actionName: ">>> reenterRoom",
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
        actionName: ">>> reenterRoom",
      });
    }
  });
};
