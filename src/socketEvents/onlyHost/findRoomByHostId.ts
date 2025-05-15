import { Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { findRoomByHostId } from "@dbActions/findRoomByHostId";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";

export const registerFindRoomByHostId = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("findRoomByHostId", ({ roomHostId }, cb) => {
    const room = findRoomByHostId({ roomHostId });
    cb({ foundedRoom: room ? cloneDeepRoom(room) : undefined });
  });
};
