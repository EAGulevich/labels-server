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
import { Op, Sequelize } from "sequelize";

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
    try {
      // факт не был отгадан в каком-либо из предыдущих раундов
      const noVotedInCurrentRound = await FactModel.findAll({
        include: [
          {
            model: VotingResultsModel,
            as: "votingResults",
            required: false,
            where: {
              round: room.currentRound,
              roomId: room.id,
            },
            attributes: [],
          },
        ],
        where: {
          roomId: room.id,
          [Op.and]: {
            "$votingResults.id$": null,
            [Op.and]: Sequelize.where(
              Sequelize.col("authorId"),
              Op.ne,
              Sequelize.col("FactModel.selectedPlayerId"),
            ),
          },
        },
        logging: console.log,
      });
      console.log({
        noVotedInCurrentRound: noVotedInCurrentRound.map((i) => ({
          text: i.text,
          factId: i.id,
        })),
      });
      throw new Error("my err");

      const players = await room.getPlayers();

      await Promise.all(
        shuffleArray(players).map((p, index) => {
          return p.update({ order: index + 1 });
        }),
      );

      const someUnvotedFactIdInCurrentRound =
        shuffleArray(noVotedInCurrentRound)[0]?.id || null;

      await room.update({
        currentVotingFactId: someUnvotedFactIdInCurrentRound,
      });
    } catch (error) {
      console.log("ERROR=============", { error });
    }
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

    const selectedPlayerId = await VoteModel.findWinnerOfVotingResult({
      factId,
      roomId,
      round: room.currentRound,
    });

    await VotingResultsModel.create({
      factId,
      roomId,
      selectedPlayerId: selectedPlayerId,
      round: room.currentRound,
    });
  }
}
