import { SocketType } from "@app";
import { HostService } from "@services/host.service";
import { sentryLog } from "@utils/logger";

export const registerFindRoomByHostId = (socket: SocketType) => {
  socket.on("findRoomByHostId", async (_, cb) => {
    try {
      const { room } = await HostService.findRoom({
        hostId: socket.data.userId,
      });

      cb({ foundedRoom: room });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        actionName: ">>> findRoomByHostId",
        message: "Хосту отдана информация о наличии комнаты",
        outputRoom: room,
      });
    } catch {
      cb({ foundedRoom: null });
      sentryLog({
        severity: "info",
        eventFrom: "server",
        actionName: ">>> findRoomByHostId",
        message: "Комната не найдена",
        outputRoom: null,
      });
    }
  });
};
