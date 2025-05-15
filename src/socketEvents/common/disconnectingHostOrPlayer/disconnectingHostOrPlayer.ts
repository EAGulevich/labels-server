import { findRoom } from "@dbActions/findRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

import { hostDisconnect } from "./parts/hostDisconnect";
import { playerDisconnect } from "./parts/playerDisconnect";

export const registerDisconnectingHostOrPlayer = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("disconnecting", () => {
    logger(`USER DISCONNECTING: ${socket.id}`);

    const isHost = !!findRoom({ findBy: "hostId", value: socket.id });
    const isPlayer = !!findRoom({ findBy: "playerId", value: socket.id });

    if (isHost) {
      hostDisconnect({ socket });
    } else if (isPlayer) {
      playerDisconnect({ socket });
    }
  });
};
