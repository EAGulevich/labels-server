import { Player, Room } from './types';

// SocketServerEventData
type SSED<T> = {
  room: Room;
  eventData: T;
};

export interface ServerToClientEvents {
  createdRoom: (data: SSED<{ createdRoom: Room }>) => void;
  joinedPlayer: (data: SSED<{ joinedPlayer: Player }>) => void;
  disconnectedPlayer: (data: SSED<{ disconnectedPlayer: Player }>) => void;
  roomClosed: (data: SSED<{ closedRoomCode: Room['code'] }>) => void;
}

export interface ClientToServerEvents {
  createRoom: () => void;
  joinRoom: (data: { roomCode: Room['code']; player: Player }) => void;
}
