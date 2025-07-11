import { ClientToServerEvents, ServerToClientEvents } from "@shared/types";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

export const app = express();

export const server = http.createServer(app);

export const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  { userId: string }
>(server, {
  cors: {
    origin: [
      "https://game-labels-preview.vercel.app",
      "https://game-labels.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

export type SocketData = {
  userId: string;
};

export type SocketType = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;
