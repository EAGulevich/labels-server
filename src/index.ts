import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { generateRoomCode } from './utils/generateRoomCode';
import { DB_ROOMS } from './db/rooms';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from './shared-types/events';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 5001;

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: [
      'https://game-labels-preview.vercel.app',
      'https://game-labels.vercel.app',
    ],
    methods: ['GET', 'POST'],
  },
});

app.get('/', (req, res) => {
  res.send('<h1>Server is running</h1>');
});

io.on('connection', (socket) => {
  logger(`User connected`, { meta: socket.id });

  socket.on('disconnecting', () => {
    logger(`User disconnecting`, { meta: socket.id });

    socket.rooms.forEach((room) => {
      const roomCode = DB_ROOMS[room]?.code;
      if (roomCode) {
        if (DB_ROOMS[roomCode].creatorSocketId === socket.id) {
          socket.to(roomCode).emit('roomClosed', {
            room: DB_ROOMS[roomCode],
            eventData: { closedRoomCode: DB_ROOMS[roomCode].code },
          });
          delete DB_ROOMS[roomCode];
          logger(`Room ${roomCode} deleted`, {
            meta: roomCode,
            showRooms: true,
          });
        } else {
          const disconnectedPlayerIndex = DB_ROOMS[roomCode].players.findIndex(
            (p) => p.id === socket.id,
          );

          const disconnectedPlayer = DB_ROOMS[roomCode].players.splice(
            disconnectedPlayerIndex,
            1,
          )[0];

          io.sockets.in(roomCode).emit('disconnectedPlayer', {
            room: DB_ROOMS[roomCode],
            eventData: { disconnectedPlayer },
          });
        }
      }
    });
  });

  socket.on('disconnect', () => {
    logger(`User disconnected`, { meta: socket.id });
  });

  socket.on('createRoom', () => {
    if (socket.rooms.size > 1) {
      logger(`Not created room`, { showRooms: true });
      // TODO

      return;
    }
    const newRoomCode = generateRoomCode();

    DB_ROOMS[newRoomCode] = {
      code: newRoomCode,
      status: 'CREATED',
      players: [],
      creatorSocketId: socket.id,
    };

    socket.join(newRoomCode);
    socket.emit('createdRoom', {
      room: DB_ROOMS[newRoomCode],
      eventData: { createdRoom: DB_ROOMS[newRoomCode] },
    });

    logger(`Created room`, { showRooms: true });
  });

  socket.on('joinRoom', ({ roomCode, player: joinedPlayer }) => {
    DB_ROOMS[roomCode] = {
      ...DB_ROOMS[roomCode],
      players: [...DB_ROOMS[roomCode].players, joinedPlayer],
    };

    socket.join(roomCode);
    io.sockets.in(roomCode).emit('joinedPlayer', {
      room: DB_ROOMS[roomCode],
      eventData: { joinedPlayer },
    });

    logger('Joined room', {
      meta: { roomCode, joinedPlayer },
      showRooms: true,
      showPlayersForRoom: roomCode,
    });
  });
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
