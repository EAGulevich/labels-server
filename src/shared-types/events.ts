import { Player, Room } from './types';

// SocketServerEventData
type SSEData<T = undefined> = T extends undefined
  ? { room: Room }
  : {
      room: Room;
      eventData: T;
    };

// SocketServerEventError
type SSEError = { message: string };

export interface ServerToClientEvents {
  createdRoom: (
    data: SSEData<{ createdRoom: Room; wasReconnect: boolean }>,
  ) => void;
  creatingRoomError: (err: SSEError) => void;

  joinedPlayer: (data: SSEData<{ joinedPlayer: Player }>) => void;
  joiningPlayerError: (err: SSEError) => void;

  disconnectedPlayer: (data: SSEData<{ disconnectedPlayer: Player }>) => void;

  // TODO: добавить различие неактивен, удален
  creatorWasDisconnect: (data: SSEData) => void;
  creatorWasConnected: (data: SSEData) => void;
}

export interface ClientToServerEvents {
  createRoom: (creatorId?: Room['creatorId'] | null) => void;
  joinRoom: (data: {
    roomCode: Room['code'];
    player: Omit<Player, 'id'>;
  }) => void;
}
