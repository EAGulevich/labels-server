import { SocketData } from "@app";
import { FactModel } from "@models/fact.model";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import { VoteModel } from "@models/vote.model";
import { VotingResultsModel } from "@models/votingResults.model";
import { HostService } from "@services/host.service";
import { PlayerService } from "@services/player.service";
import { ERROR_CODES, ROOM_STATUSES } from "@shared/types";
import { KnownError } from "@utils/KnownError";
import { shuffleArray } from "@utils/shuffleArray";
import maxBy from "lodash.maxby";

export class GameService {
  static async disconnect({
    userId,
  }: {
    userId: SocketData["userId"];
  }): Promise<void> {
    const roomByHostId = await RoomModel.findOne({
      where: {
        hostId: userId,
      },
    });

    if (roomByHostId) {
      await HostService.makeRoomInactive({
        hostId: roomByHostId.hostId,
      });
    }

    const player = await PlayerModel.findByPk(userId);
    if (player) {
      await PlayerService.disconnectPlayer({
        playerId: player.id,
      });
    }
  }

  static async updateVipPlayer({
    roomId,
  }: {
    roomId: RoomModel["id"];
  }): Promise<void> {
    const players = await PlayerModel.findAll({
      where: {
        roomId,
      },
    });

    const isVipPlayer = players.some((p) => p.isVip);

    if (!isVipPlayer) {
      const firstActivePlayer = await PlayerModel.findOne({
        where: {
          roomId,
          isFake: false,
          isActive: true,
        },
      });

      if (firstActivePlayer) {
        await firstActivePlayer.update({ isVip: true });
      }
    }
  }

  static async setNewFactForVoting({
    roomId,
  }: {
    roomId: RoomModel["id"];
  }): Promise<void> {
    const room = await RoomModel.findByPk(roomId, {
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    const allFacts = await room.getFacts();
    const players = await room.getPlayers();

    await Promise.all(
      shuffleArray(players).map((p, index) => {
        return p.update({ order: index + 1 });
      }),
    );

    const alreadyVotedFactsInCurrentRound = await VotingResultsModel.findAll({
      where: { roomId: room.id, round: room.currentRound },
    });

    const notVotedFactsYet = allFacts.filter(
      (f) =>
        // факт не был отгадан в каком-либо из предыдущих раундов
        f.authorId !== f.selectedPlayerId &&
        // за факт еще не голосовали в текущем раунде
        !alreadyVotedFactsInCurrentRound.find(
          (votingResult) => votingResult.factId === f.id,
        ),
    );

    const someUnvotedFactIdInCurrentRound =
      shuffleArray(notVotedFactsYet)[0]?.id || null;

    await room.update({
      currentVotingFactId: someUnvotedFactIdInCurrentRound,
    });
  }

  static async startNewRound({
    roomCode,
  }: {
    roomCode: string;
  }): Promise<void> {
    const room = await RoomModel.findOne({
      where: { code: roomCode },
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.ROOM_NOT_FOUND }),
    });

    await room.update({
      status: ROOM_STATUSES.ROUND,
      currentRound: room.currentRound + 1,
      currentVotingFactId: null,
    });
  }

  static async saveFactVotingResult({
    roomId,
    factId,
  }: {
    roomId: RoomModel["id"];
    factId: FactModel["id"];
  }): Promise<void> {
    const fact = await FactModel.findOne({
      where: { id: factId },
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.FACT_NOT_FOUND,
      }),
    });

    const room = await fact.getRoom();

    const allVotesForFact = await VoteModel.findAll({
      where: {
        roomId: room.id,
        round: room.currentRound,
        factId: fact.id,
      },
    });

    const votesMap = allVotesForFact.reduce<{
      // id игрока : кол-во голосов за него
      [playerId: string]: number;
    }>((acc, vote) => {
      if (!acc[vote.selectedPlayerId]) {
        acc[vote.selectedPlayerId] = 0;
      }
      acc[vote.selectedPlayerId]++;
      return acc;
    }, {});

    const playerIdWithMaxVotes = maxBy(
      Object.entries(votesMap).map(([playerId, votesCount]) => ({
        playerId,
        votesCount,
      })),
      (val) => val.votesCount,
    );

    const isOnlyOnePlayerWithMaxVotesCount =
      Object.values(votesMap).filter(
        (val) => val === playerIdWithMaxVotes?.votesCount,
      ).length === 1;

    const selectedPlayerId =
      playerIdWithMaxVotes && isOnlyOnePlayerWithMaxVotesCount
        ? playerIdWithMaxVotes.playerId
        : null;

    await VotingResultsModel.create({
      factId,
      roomId,
      selectedPlayerId,
      round: room.currentRound,
    });
  }
}
