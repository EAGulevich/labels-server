import winston from "winston";

import { DB_ROOMS } from "../db/rooms";
import { DBRoom } from "../db/types";

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

    const prettyRooms: unknown[] = [];

    const rooms = Object.values(DB_ROOMS) as DBRoom[];

    rooms.forEach(({ players, facts, ...room }) => {
      prettyRooms.push({
        ...room,
        players: players.length,
        facts: facts.length,
      });
      players.forEach((p) => {
        const fact = facts.find((f) => f.playerId === p.id);
        prettyRooms.push({
          players: `vip[${p.isVip ? "+" : "-"}] active[${p.isActive ? "+" : "-"}] name[${p.name}] id[${p.id}]`,
          facts: fact ? `isGuessed[${fact.isGuessed}] ${fact.text}` : "",
        });
      });
    });

    console.log("DB_ROOMS:");
    console.table(prettyRooms);
  }
};
