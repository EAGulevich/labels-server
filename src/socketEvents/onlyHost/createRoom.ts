import { SocketType } from "@app";
import { HostService } from "@services/host.service";
import { sentryLog } from "@utils/logger";
import { prettyErr } from "@utils/prettyErr";

export const registerCreateRoom = (socket: SocketType) => {
  socket.on("createRoom", async (_, cb) => {
    sentryLog({
      actionName: "createRoom",
      severity: "info",
      eventFrom: "client",
      message: "Хост создает комнату",
      userId: socket.data.userId,
    });
    try {
      // при создании используем текущий socket.id для хоста
      const hostId = socket.id;
      const { room } = await HostService.createRoom({
        hostId,
      });

      socket.data.userId = socket.id;
      await socket.join(room.code);

      cb({
        success: true,
        room: room,
        extra: {
          userId: hostId,
        },
      });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        actionName: ">>> createRoom",
        outputRoom: room,
        message: "Комната создана",
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
        actionName: ">>> createRoom",
      });
    }
  });
};
