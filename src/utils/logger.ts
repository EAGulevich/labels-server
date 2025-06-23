import { VERSION } from "@constants";
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

  let meta: { c: Record<string, unknown>; extra: Record<string, unknown> } = {
    c: {
      version: VERSION,
      room_code: roomCode,
      from: eventFrom,
      action: actionName,
    },
    extra: {},
  };

  if (eventFrom === "server") {
    meta.c.to = logData.eventTo;
  } else if (eventFrom === "client") {
    meta.c.from_type = logData.eventFromType;
    meta.extra.input_data = logData.eventInputData;
  } else {
    meta.extra.changes = logData.changes;
  }

  meta.extra.room_state = DB_ROOMS[roomCode] || null;
  meta.c.status = DB_ROOMS[roomCode]?.status || null;
  meta.c.round = DB_ROOMS[roomCode]?.round || null;

  Sentry.logger[severity](message, flattenObject(meta));
};
