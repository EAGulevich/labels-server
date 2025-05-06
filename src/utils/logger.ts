import winston from 'winston';
import { DB_ROOMS } from '../db/rooms';

const log = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    // new winston.transports.Console(),
    new winston.transports.File({ filename: 'socket.log' }),
  ],
});

export const logger = (
  message: string,
  {
    meta,
    showRooms,
    showPlayersForRoom,
  }: { meta?: any; showRooms?: boolean; showPlayersForRoom?: string } = {},
) => {
  log.info(message, meta, showRooms);

  console.log(message);

  if (showRooms) {
    console.table(DB_ROOMS);
  }

  if (showPlayersForRoom) {
    console.table(DB_ROOMS[showPlayersForRoom]);
  }
};
