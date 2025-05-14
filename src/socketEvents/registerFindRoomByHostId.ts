import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { findRoomByHostId } from "@dbActions/findRoomByHostId";

export const registerFindRoomByHostId = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("findRoomByHostId", ({ roomHostId }, cb) => {
    cb({ foundedRoom: findRoomByHostId({ roomHostId }) });
  });
};
