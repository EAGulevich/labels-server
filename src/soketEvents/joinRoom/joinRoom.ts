import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared-types/events';
import { DB_ROOMS } from '../../db/rooms';
import { logger } from '../../utils/logger';
import { DB_PLAYERS } from '../../db/players';

export const addListenerJoinRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on('joinRoom', ({ roomCode, player: joinedPlayer }) => {
    const oldRoomCode = DB_PLAYERS[socket.id];
    const playerInOldRoom = DB_ROOMS[oldRoomCode]?.players.find(
      (p) => p.id === socket.id,
    );

    //   выйти из прошлой комнаты, если она есть
    if (oldRoomCode !== roomCode && playerInOldRoom) {
      socket.leave(oldRoomCode);

      DB_ROOMS[oldRoomCode].players = DB_ROOMS[oldRoomCode].players.filter(
        (p) => p.id !== socket.id,
      );

      delete DB_PLAYERS[socket.id];
      io.sockets.in(oldRoomCode).emit('disconnectedPlayer', {
        room: DB_ROOMS[oldRoomCode],
        eventData: {
          disconnectedPlayer: playerInOldRoom,
        },
      });
      logger(
        'Player was deleted from old room, because he is joining to another Room',
        {
          meta: { roomCode, joinedPlayer },
          showDBRooms: true,
          showPlayersInRoom: oldRoomCode,
          showDBPlayers: true,
        },
      );
    }

    //   ничего не делать, если игрок уже в комнате и пытается войти в нее заново
    if (oldRoomCode === roomCode && playerInOldRoom) {
      socket.emit('joinedPlayer', {
        room: DB_ROOMS[roomCode],
        eventData: { joinedPlayer: playerInOldRoom },
      });

      logger(`Player ${playerInOldRoom.id} already in room ${roomCode}`, {
        meta: { roomCode, joinedPlayer },
        showDBRooms: true,
        showPlayersInRoom: roomCode,
        showDBPlayers: true,
      });
    } else {
      const newPlayer = {
        ...joinedPlayer,
        id: socket.id,
      };

      // если комнаты не существует
      if (!DB_ROOMS[roomCode]) {
        socket.emit('joiningPlayerError', {
          message: `Not join player ${socket.id} in room ${roomCode} because it not existing`,
        });
        logger(
          `Not join player ${socket.id} in room ${roomCode} because it not existing`,
          {
            showDBRooms: true,
          },
        );
      } else {
        DB_ROOMS[roomCode].players.push(newPlayer);
        DB_PLAYERS[newPlayer.id] = roomCode;

        socket.join(roomCode);

        io.sockets.in(roomCode).emit('joinedPlayer', {
          room: DB_ROOMS[roomCode],
          eventData: { joinedPlayer: newPlayer },
        });

        logger('Joined room', {
          meta: { roomCode, joinedPlayer },
          showDBRooms: true,
          showPlayersInRoom: roomCode,
          showDBPlayers: true,
        });
      }
    }
  });
};
