import { io } from "@app";
import { addVote } from "@dbActions/addVote";
import { applyVotesForFact } from "@dbActions/applyVotesForFact";
import { findRoom } from "@dbActions/findRoom";
import { getNextFactForVoting } from "@dbActions/getNextFactForVoting";
import { setVotingFact } from "@dbActions/setVotingFact";
import { startNewRound } from "@dbActions/startNewRound";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@sharedTypes/events";
import { cloneDeepRoom } from "@utils/cloneDeepRoom";
import { logger } from "@utils/logger";
import { Socket } from "socket.io";

export const registerAddVote = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  socket.on("addVote", ({ candidateId }) => {
    logger(`<--- addVote`, {
      meta: { playerId: socket.id, candidateId: candidateId },
    });

    const room = findRoom({ findBy: "playerId", value: socket.id });

    if (room) {
      const { changedRoom, isAllPlayersVotedForFact } = addVote({
        roomCode: room.code,
        candidateId,
      });

      if (changedRoom) {
        io.to(room.code).emit("voting", {
          room: cloneDeepRoom(changedRoom),
        });

        if (isAllPlayersVotedForFact) {
          applyVotesForFact({
            roomCode: changedRoom.code,
          });

          setTimeout(() => {
            const { votingFact, isAllFactsHasCandidate } = getNextFactForVoting(
              {
                roomCode: room.code,
              },
            );

            if (isAllFactsHasCandidate) {
              const { changedRoom: changedRoomForNewRound } = startNewRound({
                roomCode: room.code,
              });
              if (changedRoomForNewRound) {
                io.to(room.code).emit("newRoundStarted", {
                  room: cloneDeepRoom(changedRoomForNewRound),
                });
              }
            } else if (votingFact) {
              const { changedRoom: changedRoomWithNewFact } = setVotingFact({
                roomCode: room.code,
                votingFact: {
                  ...votingFact,
                  candidates: [...votingFact.candidates],
                },
              });

              if (changedRoomWithNewFact) {
                io.to(room.code).emit("voting", {
                  room: cloneDeepRoom(changedRoomWithNewFact),
                });
              }
            }
            //   TODO 5000
          }, 5000);
        }
      }

      logger(`---> addedVote`, {
        meta: {
          socketId: socket.id,
          roomCode: room?.code,
        },
      });
    }
  });
};
