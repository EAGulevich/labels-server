import winston from "winston";

import { DB_HOSTS } from "../db/hosts";
import { DB_PLAYERS } from "../db/players";
import { DB_ROOMS } from "../db/rooms";

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
    isError,
    meta,
    showDBRooms,
    showDBRoomHosts,
    showPlayersInRoom,
    showDBPlayers,
  }: {
    isError?: boolean;
    meta?: any;
    showDBRooms?: boolean;
    showDBRoomHosts?: boolean;
    showDBPlayers?: boolean;
    showPlayersInRoom?: string;
  } = {},
) => {
  if (isError) {
    log.error(message, meta);
  } else {
    log.info(message, meta, showDBRooms);
  }

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
    console.table(DB_HOSTS);
  }

  if (showDBPlayers) {
    console.log("DB_PLAYERS:");
    console.table(DB_PLAYERS);
  }

  if (showPlayersInRoom) {
    console.log(`PLAYERS IN ROOM ${showPlayersInRoom}:`);
    console.table(DB_ROOMS[showPlayersInRoom]?.players);
  }

  console.log("_________________________");
};
