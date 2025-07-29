import { ErrModel, PlayerClient, RoomClient } from "@shared/types";

type SuccessResponse<T> = T extends undefined
  ? {
      success: true;
      room: RoomClient;

      error?: undefined;
    }
  : {
      success: true;
      room: RoomClient;
      extra: T;

      error?: undefined;
    };

type ErrorResponse = {
  success: false;
  error: ErrModel;

  room?: undefined;
  extra?: undefined;
};

type Response<T = undefined> = SuccessResponse<T> | ErrorResponse;

type EventData<T = undefined> = { logMsg: string } & (T extends undefined
  ? {
      room: RoomClient;
    }
  : {
      room: RoomClient;
      extra: T;
    });

export interface ServerToClientEvents {
  hostLeftRoom: (data: EventData) => void;
  hostReturnedToRoom: (data: EventData) => void;
  joinedPlayer: (data: EventData<{ joinedPlayer: PlayerClient }>) => void;
  disconnectedPlayer: (
    data: EventData<{ disconnectedPlayerName: string }>,
  ) => void;
  playerHasReconnected: (
    data: EventData<{ reconnectedPlayer: PlayerClient }>,
  ) => void;
  playerLostConnection: (
    data: EventData<{ markedInactivePlayer: PlayerClient }>,
  ) => void;
  updateVipPlayer: (data: EventData<{ newVipPlayer: PlayerClient }>) => void;
  playerChangedAvatar: (
    data: EventData<{ updatedPlayer: PlayerClient }>,
  ) => void;

  gameStarted: (data: EventData) => void;

  playerAddedFact: (data: EventData<{ fromPlayer: PlayerClient }>) => void;

  newRoundStarted: (data: EventData) => void;

  voting: (data: EventData) => void;

  results: (data: EventData) => void;
}

export interface ClientToServerEvents {
  findRoomByHostId: (
    data: null,
    cb: (res: { foundedRoom: RoomClient | null }) => void,
  ) => void;

  createRoom: (
    data: { lang: "ru" | "en" },
    cb: (res: Response<{ userId: string }>) => void,
  ) => void;

  reenterRoom: (data: null, cb: (res: Response) => void) => void;

  joinRoom: (
    data: {
      roomCode: RoomClient["code"];
      player: Pick<PlayerClient, "name">;
    },
    cb: (res: Response<{ userId: string; userName: string }>) => void,
  ) => void;

  changeAvatar: (
    data: { avatarToken: PlayerClient["avatar"]["token"] },
    cb: (
      res: Response<{ changedAvatar: PlayerClient["avatar"]["token"] }>,
    ) => void,
  ) => void;

  startGame: (data: null, cb: (res: Response) => void) => void;

  addFact: (
    data: { text: string },
    cb: (res: Response<{ createdFact: string }>) => void,
  ) => void;

  startVoting: (data: null, cb: (res: Response) => void) => void;

  addVote: (
    data: { candidateId: string; factId: number },
    cb: (res: Response<{ voted: true }>) => void,
  ) => void;

  showResult: (data: null, cb: (res: Response) => void) => void;
}
