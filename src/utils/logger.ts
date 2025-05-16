import { Room } from "@sharedTypes/types";
import winston from "winston";

import { DB_ROOMS } from "../db/rooms";

const log = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [new winston.transports.File({ filename: "socket.log" })],
});

export const logger = (
  message: string,
  {
    isError,
    meta,
  }: {
    isError?: boolean;
    meta?: any;
  } = {},
) => {
  if (isError) {
    log.error(message, meta);
  } else {
    log.info(message, meta);
    console.info(message);

    console.log("DB_ROOMS:");
    const prettyRooms: unknown[] = [];
    const rooms = Object.values(DB_ROOMS) as Room[];
    rooms.forEach(({ players, ...room }) => {
      prettyRooms.push({ ...room, players: "list:" });
      players.forEach((p) => {
        prettyRooms.push({
          players: `vip[${p.isVip ? "+" : "-"}] active[${p.isActive ? "+" : "-"}] name[${p.name}] id[${p.id}]`,
        });
      });
    });

    console.table(prettyRooms);
  }
};
