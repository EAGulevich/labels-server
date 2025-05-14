import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";

export const app = express();

export const server = http.createServer(app);
export const io = new Server<ClientToServerEvents, ServerToClientEvents>(
  server,
  {
    cors: {
      origin: [
        "https://game-labels-preview.vercel.app",
        "https://game-labels.vercel.app",
      ],
      methods: ["GET", "POST"],
    },
  },
);
