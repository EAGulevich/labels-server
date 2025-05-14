import { ReadonlyRoom, ReadonlyPlayer, Room, Player } from "./types";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";

// SocketServerEventData
type SSEData<T = undefined> = T extends undefined
  ? { room: ReadonlyRoom }
  : {
      room: ReadonlyRoom;
      eventData: T;
    };

type SSEDataWithError<T = undefined> =
  | {
      data: SSEData<T>;
    }
  | {
      error: {
        code: ERROR_CODE;
        message: string;
      } | null;
    };

export interface ServerToClientEvents {
  // Connect/Disconnect events
  hostLeftRoom: (data: SSEData) => void;
  hostReturnedToRoom: (data: SSEData) => void;
  joinedPlayer: (data: SSEData<{ joinedPlayer: ReadonlyPlayer }>) => void;
  disconnectedPlayer: (
    data: SSEData<{ disconnectedPlayer: ReadonlyPlayer }>,
  ) => void;
}

export interface ClientToServerEvents {
  findRoomByHostId: (
    data: { roomHostId: string },
    cb: (res: { foundedRoom: ReadonlyRoom | undefined }) => void,
  ) => void;

  createRoom: (
    data: null,
    cb: (res: SSEData<{ newRoomHostId: string }>) => void,
  ) => void;

  reenterRoom: (
    data: { roomHostId: string },
    cb: (res: SSEDataWithError<{ newRoomHostId: string }>) => void,
  ) => void;

  joinRoom: (
    data: {
      roomCode: Room["code"];
      player: Pick<Player, "name" | "avatarToken">;
    },
    cb: (res: SSEDataWithError) => void,
  ) => void;
}
