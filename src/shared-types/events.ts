import { ERROR_CODE } from "./errorNameCodes";
import { Player, Room } from "./types";

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
  disconnectedPlayer: (data: SSEData<{ disconnectedPlayer: Player }>) => void;
  playerHasReconnected: (data: SSEData<{ reconnectedPlayer: Player }>) => void;
  playerLostConnection: (
    data: SSEData<{ markedInactivePlayer: Player }>,
  ) => void;
  updateVipPlayer: (data: SSEData<{ newVipPlayer: Player }>) => void;

  gameStarted: (data: SSEData) => void;

  playerAddedFact: (data: SSEData<{ fromPlayer: Player }>) => void;

  newRound: (data: SSEData) => void;
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
      prevPlayerId?: string;
      roomCode: Room["code"];
      player: Pick<Player, "name" | "avatarToken">;
    },
    cb: (res: SSEDataWithError<{ joinedPlayer: Player }>) => void,
  ) => void;

  startGame: () => void;

  addFact: (
    data: { text: string },
    cb: (res: SSEDataWithError<{ createdFact: string }>) => void,
  ) => void;
}
