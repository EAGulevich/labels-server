import { MAX_PLAYERS } from "@constants";
import { findRoom } from "@dbActions/findRoom";
import { ERROR_CODE } from "@sharedTypes/errorNameCodes";

type ValidateProps = {
  roomCode: string;
};

type ValidateReturn = {
  code: ERROR_CODE;
  message: string;
} | null;

export const validateJoinRoom = ({
  roomCode,
}: ValidateProps): ValidateReturn => {
  const error = null;

  const room = findRoom({
    findBy: "roomCode",
    value: roomCode,
  });

  if (!room) {
    const message = `Not joined to room, because room with roomCode ${roomCode} not found`;
    return {
      code: ERROR_CODE.ROOM_NOT_FOUND_JOIN_ERROR,
      message,
    };
  } else if (room.status !== "CREATED") {
    const message = `Not joined to room, because room status is ${room.status}`;
    return {
      code: ERROR_CODE.GAME_ALREADY_STARTED_JOIN_ERROR,
      message,
    };
  } else if (room.players.length === MAX_PLAYERS) {
    const message = `Not joined to room, because there is max number of players in the room ${room.code}`;
    return {
      code: ERROR_CODE.MAX_ROOM_CAPACITY_JOIN_ERROR,
      message,
    };
  }

  return error;
};
