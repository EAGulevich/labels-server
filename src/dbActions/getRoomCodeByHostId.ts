import { DB_ROOM_HOSTS } from "../db/roomHosts";

export const getRoomCodeByHostId = (roomHostId: string): string | undefined =>
  DB_ROOM_HOSTS[roomHostId];
