import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from './shared-types/events';
import { logger } from './utils/logger';
import { addListenerCreateRoom } from './soketEvents/createRoom/createRoom';
import { addListenerDisconnectingSocket } from './soketEvents/diconnectingSocket/disconnectingSocket';
import { addListenerJoinRoom } from './soketEvents/joinRoom/joinRoom';

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
  logger(`User connected ${socket.id}`);

  addListenerDisconnectingSocket(socket, io);

  addListenerCreateRoom(socket, io);

  addListenerJoinRoom(socket, io);
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
