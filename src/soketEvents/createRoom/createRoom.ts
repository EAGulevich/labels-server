import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared-types/events';
import { DB_ROOMS } from '../../db/rooms';
import { logger } from '../../utils/logger';
import { DB_CREATORS } from '../../db/creators';
import { generateRoomCode } from '../../utils/generateRoomCode';
import { Room } from '../../shared-types/types';

const sendErrorCreateRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  creatorId: string,
) => {
  socket.emit('creatingRoomError', {
    message: `Not found room by creator id ${creatorId}`,
  });
  logger(`Not created room: Not found room with creatorId=${creatorId}`, {
    showDBRooms: true,
  });
};

const reconnectCreatedRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  creatorId: string,
  roomByCreatorId: Room,
) => {
  const oldIdOfCreator = roomByCreatorId.creatorId;
  const newIdOfCreator = socket.id;

  roomByCreatorId.isInactive = false;
  roomByCreatorId.creatorId = newIdOfCreator;

  delete DB_CREATORS[oldIdOfCreator];
  DB_CREATORS[newIdOfCreator] = roomByCreatorId.code;

  socket.join(roomByCreatorId.code);
  socket.emit('createdRoom', {
    room: roomByCreatorId,
    eventData: { createdRoom: roomByCreatorId, wasReconnect: true },
  });

  io.sockets.in(roomByCreatorId.code).emit('creatorWasConnected', {
    room: roomByCreatorId,
  });

  logger(
    `Not created room: Was found room ${roomByCreatorId.code} with creatorId=${creatorId}. Was set new creatorId=${socket.id}`,
    {
      showDBRooms: true,
    },
  );
};

const createRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  // TODO: обработать попытку создания нескольких комнат одновременно от 1 сокета
  const newRoom: Room = {
    code: generateRoomCode(),
    status: 'CREATED',
    players: [],
    creatorId: socket.id,
    isInactive: false,
  };

  DB_ROOMS[newRoom.code] = newRoom;
  DB_CREATORS[newRoom.creatorId] = newRoom.code;

  socket.join(newRoom.code);
  socket.emit('createdRoom', {
    room: newRoom,
    eventData: { createdRoom: newRoom, wasReconnect: false },
  });

  logger(`Created room ${newRoom.code}`, { showDBRooms: true });
};

export const addListenerCreateRoom = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on('createRoom', (creatorId) => {
    const needReconnectHost = !!creatorId;

    if (needReconnectHost) {
      const roomByCreatorId = Object.values(DB_ROOMS).find(
        (room) => room.creatorId === creatorId,
      );

      if (!roomByCreatorId) {
        sendErrorCreateRoom(socket, creatorId);
      } else {
        reconnectCreatedRoom(socket, io, creatorId, roomByCreatorId);
      }
    } else {
      createRoom(socket);
    }
  });
};
