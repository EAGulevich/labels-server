import { SocketType } from "@app";
import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import { sentryLog } from "@utils/logger";

export const registerLogging = (socket: SocketType) => {
  socket.onAnyOutgoing(
    <T extends keyof ServerToClientEvents>(
      eventName: T,
      eventData: Parameters<ServerToClientEvents[T]>[0],
    ) => {
      eventData.room.code;

      sentryLog({
        severity: "info",
        eventFrom: "server",
        actionName: eventName,
        outputRoom: eventData.room,
        message: `==>>> ${eventData.logMsg}`,
      });
    },
  );

  socket.onAny(
    <T extends keyof ClientToServerEvents>(
      eventName: T,
      inputData: Parameters<ClientToServerEvents[T]>[0],
    ) => {
      sentryLog({
        severity: "info",
        eventFrom: "client",
        actionName: eventName,
        userId: socket.data.userId,
        input: { ...inputData },
        message: "<<<==",
      });
    },
  );
};
