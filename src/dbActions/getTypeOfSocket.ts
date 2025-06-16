import { DB_HOSTS } from "../db/hosts";
import { DB_PLAYERS } from "../db/players";

export const getTypeOfSocket = (
  socketId: string,
): "host" | "player" | "unknown" => {
  if (DB_HOSTS[socketId]) {
    return "host";
  } else if (DB_PLAYERS[socketId]) {
    return "player";
  } else {
    return "unknown";
  }
};
