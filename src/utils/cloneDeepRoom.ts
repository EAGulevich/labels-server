import { DeepReadonly, Room } from "@sharedTypes/types";

export const cloneDeepRoom = (room: DeepReadonly<Room>): Room => {
  return { ...room, players: [...room.players] };
};
