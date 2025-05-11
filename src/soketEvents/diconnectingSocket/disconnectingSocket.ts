import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared-types/events';
import { DB_CREATORS } from '../../db/creators';
import { DB_ROOMS } from '../../db/rooms';
import { logger } from '../../utils/logger';
import { DB_PLAYERS } from '../../db/players';

export const addListenerDisconnectingSocket = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on('disconnecting', () => {
    const isUserCreator = !!DB_CREATORS[socket.id];

    if (isUserCreator) {
      const roomByCreatorId = DB_ROOMS[DB_CREATORS[socket.id]];
      //   TODO: удалять через X секунд неактивные комнаты
      roomByCreatorId.isInactive = true;

      logger(`Creator disconnecting ${socket.id}`, {
        showDBCreators: true,
        showDBRooms: true,
      });
      io.sockets.in(roomByCreatorId.code).emit('creatorWasDisconnect', {
        room: roomByCreatorId,
      });
    } else {
      logger(`User disconnecting ${socket.id}`);
      const roomCodeByPlayer = DB_PLAYERS[socket.id];
      const roomByPlayer = DB_ROOMS[roomCodeByPlayer];

      if (roomByPlayer) {
        const disconnectedPlayerIndex = roomByPlayer.players.findIndex(
          (p) => p.id === socket.id,
        );

        // TODO: данное удаление игрока должно быть только для комнат со статусом Created
        const disconnectedPlayer = roomByPlayer.players.splice(
          disconnectedPlayerIndex,
          1,
        )[0];
        delete DB_PLAYERS[socket.id];

        io.sockets.in(roomCodeByPlayer).emit('disconnectedPlayer', {
          room: roomByPlayer,
          eventData: { disconnectedPlayer },
        });

        logger(`Player disconnecting ${socket.id}`, {
          showDBPlayers: true,
          showDBRooms: true,
          showPlayersInRoom: roomCodeByPlayer,
        });
      }
    }
  });
};
