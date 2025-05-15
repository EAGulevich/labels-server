import { Room, Player } from "./types";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";

// SocketServerEventData
type SSEData<T = undefined> = T extends undefined
  ? { room: Room }
  : {
      room: Room;
      eventData: T;
    };

type SSEDataWithError<T = undefined> =
  | {
      data: SSEData<T>;
      error?: null;
    }
  | {
      data?: null;
      error: {
        code: ERROR_CODE;
        message: string;
      } | null;
    };

export interface ServerToClientEvents {
  // Connect/Disconnect events
  hostLeftRoom: (data: SSEData) => void;
  hostReturnedToRoom: (data: SSEData) => void;
  joinedPlayer: (data: SSEData<{ joinedPlayer: Player }>) => void;
  // TODO: разграничить вышел и стал неактивным
  disconnectedPlayer: (data: SSEData<{ disconnectedPlayer: Player }>) => void;
}

export interface ClientToServerEvents {
  findRoomByHostId: (
    data: { roomHostId: string },
    cb: (res: { foundedRoom: Room | undefined }) => void,
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
