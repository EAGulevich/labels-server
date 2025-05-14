import { DB_ROOMS } from "../db/rooms";
import { ReadonlyRoom } from "@sharedTypes/types";

export const findRoomByHostId = ({
  roomHostId,
}: {
  roomHostId: string;
}): ReadonlyRoom | undefined => {
  return Object.values(DB_ROOMS).find((room) => room?.hostId === roomHostId);
};
