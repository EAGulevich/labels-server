import { ReadonlyRoom, Room } from "@sharedTypes/types";

export const cloneDeepRoom = (room: ReadonlyRoom): Room => {
  return { ...room, players: [...room.players] };
};
