import { DB_PLAYERS } from "../db/players";

export const getRoomCodeByPlayerId = (playerId: string): string | undefined =>
  DB_PLAYERS[playerId];
