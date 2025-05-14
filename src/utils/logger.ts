import winston from "winston";
import { DB_ROOMS } from "../db/rooms";
import { DB_ROOM_HOSTS } from "../db/roomHosts";
import { DB_PLAYERS } from "../db/players";

const log = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: "socket.log" }),
  ],
});

export const logger = (
  message: string,
  {
    meta,
    showDBRooms,
    showDBRoomHosts,
    showPlayersInRoom,
    showDBPlayers,
  }: {
    meta?: any;
    showDBRooms?: boolean;
    showDBRoomHosts?: boolean;
    showDBPlayers?: boolean;
    showPlayersInRoom?: string;
  } = {},
) => {
  log.info(message, meta, showDBRooms);

  console.info(message);
  if (meta) {
    console.table(meta);
  }

  if (showDBRooms) {
    console.log("DB_ROOMS:");
    console.table(DB_ROOMS);
  }

  if (showDBRoomHosts) {
    console.log("DB_HOSTS:");
    console.table(DB_ROOM_HOSTS);
  }

  if (showDBPlayers) {
    console.log("DB_PLAYERS:");
    console.table(DB_PLAYERS);
  }

  if (showPlayersInRoom) {
    console.log(`Players in room ${showPlayersInRoom}:`);
    console.table(DB_ROOMS[showPlayersInRoom]?.players);
  }
};
