import Sentry from "@sentry/node";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { flattenObject } from "@utils/flattenObject";
import { Socket } from "socket.io";

import { DB_ROOMS } from "../db/rooms";

export type Changes = { fieldName: string; newValue: unknown }[];

type LogDataClient = {
  eventFrom: "client";
  eventFromType: "host" | "player" | "unknown";
  eventInputData: Record<string, unknown> & { socketId: string };
  actionName:
    | Parameters<Socket<ClientToServerEvents, ServerToClientEvents>["on"]>[0]
    | "connection"
    | "disconnecting";
};

type LogDataBD = {
  eventFrom: "DB";
  actionName: "DBChanged" | "errorChangingDB" | "search";
  changes: Changes;
};

type LogDataServer = {
  eventFrom: "server";
  eventTo:
    | "host"
    | "player"
    | "players"
    | "all"
    | "unknown"
    | "nobody"
    | `all except ${string}`;
  actionName:
    | Parameters<Socket<ClientToServerEvents, ServerToClientEvents>["emit"]>[0]
    | `>>> ${Parameters<Socket<ClientToServerEvents, ServerToClientEvents>["on"]>[0]}`
    | "error";
};

export type LogDataType = {
  severity: "error" | "info";
  roomCode: string;
  message: string;
} & (LogDataClient | LogDataServer | LogDataBD);

export const sentryLog = (logData: LogDataType) => {
  const { severity, message, eventFrom, roomCode, actionName } = logData;

  let meta: Record<string, unknown> = {
    severity,
    environment: process.env.NODE_ENV,
    message: message,
    _room: roomCode,
    _from: eventFrom,
    _action: actionName,
  };

  if (eventFrom === "server") {
    meta._to = logData.eventTo;
  } else if (eventFrom === "client") {
    meta._from_type = logData.eventFromType;
    meta["~input_data"] = logData.eventInputData;
  } else {
    meta["~changes"] = logData.changes;
  }

  meta["~room_state"] = DB_ROOMS[roomCode] || null;

  Sentry.logger[severity](message, flattenObject(meta));
};
