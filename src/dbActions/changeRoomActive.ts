import { sentryLog } from "@utils/logger";

import { DB_ROOMS } from "../db/rooms";

export const changeRoomActive = ({
  roomCode,
  isInactive,
}: {
  roomCode: string;
  isInactive: boolean;
}): void => {
  const room = DB_ROOMS[roomCode];

  if (!room) {
    sentryLog({
      severity: "error",
      actionName: "errorChangingDB",
      eventFrom: "DB",
      changes: [],
      message:
        "Не удалось изменить статус активности комнаты, т.к. комната не найдена",
      roomCode: roomCode,
    });
    return;
  }

  room.isInactive = isInactive;

  sentryLog({
    severity: "info",
    actionName: "DBChanged",
    eventFrom: "DB",
    changes: [{ fieldName: "room.isInactive", newValue: room.isInactive }],
    message: `Комната изменила статус активности на [${room.isInactive}]`,
    roomCode: roomCode,
  });
};
