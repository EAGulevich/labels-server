import winston from 'winston';
import { DB_ROOMS } from '../db/rooms';
import { DB_CREATORS } from '../db/creators';
import { DB_PLAYERS } from '../db/players';

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
    showDBRooms,
    showDBCreators,
    showPlayersInRoom,
    showDBPlayers,
  }: {
    meta?: any;
    showDBRooms?: boolean;
    showDBCreators?: boolean;
    showDBPlayers?: boolean;
    showPlayersInRoom?: string;
  } = {},
) => {
  log.info(message, meta, showDBRooms);

  console.log('----------------------------------------------');
  console.info(message);

  if (showDBRooms) {
    console.log('Rooms:');
    console.table(DB_ROOMS);
  }

  if (showDBCreators) {
    console.log('Creators:');
    console.table(DB_CREATORS);
  }

  if (showDBPlayers) {
    console.log('Players:');
    console.table(DB_PLAYERS);
  }

  if (showPlayersInRoom) {
    console.log(`Players in room ${showPlayersInRoom}:`);
    console.table(DB_ROOMS[showPlayersInRoom].players);
  }
};
