import { io } from "@app";
import { findRoom } from "@dbActions/findRoom";
import { getNextFactForVoting } from "@dbActions/getNextFactForVoting";
import { setVotingFact } from "@dbActions/setVotingFact";
import { startVoting } from "@dbActions/startVoting";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerStartVoting = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("startVoting", () => {
    logger(`<--- startVoting`, { meta: { socketId: socket.id } });

    const foundedRoomCode = findRoom({
      findBy: "hostId",
      value: socket.id,
    })?.code;

    const { changedRoom: startedVotingRoom } = startVoting({
      roomCode: foundedRoomCode!,
    });

    if (startedVotingRoom) {
      const { votingFact } = getNextFactForVoting({
        roomCode: startedVotingRoom.code,
      });

      if (votingFact) {
        const { changedRoom } = setVotingFact({
          roomCode: startedVotingRoom.code,
          votingFact: { ...votingFact, candidates: [...votingFact.candidates] },
        });

        if (changedRoom) {
          io.to(changedRoom.code).emit("voting", {
            room: cloneDeepRoom(changedRoom),
          });
        }
      }
    }

    logger(`---> voting`);
  });
};
