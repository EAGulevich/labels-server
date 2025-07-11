import { UNKNOWN_ROOM_CODE, VERSION } from "@constants";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import Sentry from "@sentry/node";
import {
  ClientToServerEvents,
  RoomClient,
  ServerToClientEvents,
} from "@shared/types";
import { flattenObject } from "@utils/flattenObject";
import { prettyErr } from "@utils/prettyErr";
import { Socket } from "socket.io";

type LogDataClient = {
  eventFrom: "client";
  userId: string;
  actionName:
    | Parameters<Socket<ClientToServerEvents, ServerToClientEvents>["on"]>[0]
    | "connection"
    | "disconnecting";
  input?: Record<string, unknown>;
};

type LogDataServer = {
  eventFrom: "server";
  actionName:
    | Parameters<Socket<ClientToServerEvents, ServerToClientEvents>["emit"]>[0]
    | `>>> ${Parameters<Socket<ClientToServerEvents, ServerToClientEvents>["on"]>[0]}`
    | "error";
} & (
  | { outputRoom: RoomClient | null }
  | { outputRoom?: RoomClient; error: any }
);

export type LogDataType = {
  severity: "error" | "info";
  message: string;
} & (LogDataClient | LogDataServer);

export const sentryLog = async (logData: LogDataType) => {
  const { severity, message, eventFrom, actionName } = logData;

  let meta: Record<string, unknown> & { extra: RoomModel | {} } = {
    version: VERSION,
    from: eventFrom,
    action: actionName,
    extra: {},
  };

  if (eventFrom === "server") {
    meta.extra = logData.outputRoom || {};
    meta.room_code = logData.outputRoom?.code || UNKNOWN_ROOM_CODE;
  } else if (eventFrom === "client") {
    const hostRoom = await RoomModel.findOne({
      where: {
        hostId: logData.userId,
      },
    });
    const player = await PlayerModel.findByPk(logData.userId);
    const playerRoom = await player?.getRoom();

    const room = hostRoom || playerRoom;

    meta.room_code = room?.code || UNKNOWN_ROOM_CODE;
    meta.round = room?.currentRound || "-";
    meta.from_name = !!hostRoom ? `ХОСТ ${hostRoom.code}` : player?.name || "-";
    meta.extra = hostRoom || playerRoom || {};
  }

  Sentry.logger[severity](message, flattenObject(meta));
};

export const sentryLogError = (err: unknown) => {
  sentryLog({
    severity: "error",
    eventFrom: "server",
    message: prettyErr(err).description,
    error: err,
    actionName: ">>> error",
  });
};
