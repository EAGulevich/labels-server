import { findRoom } from "@dbActions/findRoom";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { Socket } from "socket.io";

export const registerFindRoomByHostId = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("findRoomByHostId", ({ roomHostId }, cb) => {
    const room = findRoom({ findBy: "hostId", value: roomHostId });

    cb({ foundedRoom: room ? cloneDeepRoom(room) : undefined });
  });
};
