import { io } from "@app";
import { FactModel } from "@models/fact.model";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import { GameService } from "@services/game.service";
import { ERROR_CODES } from "@shared/types";
import { KnownError } from "@utils/KnownError";
import {
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  UniqueConstraintError,
} from "sequelize";

import { sequelize } from "./index";

const TABLE_NAME = "votes";

/** Голос игрока в конкретном раунде за конкретный факт и конкретного игрока */
export class VoteModel extends Model<
  InferAttributes<VoteModel>,
  InferCreationAttributes<VoteModel>
> {
  declare round: number;
  declare isCorrect: boolean;

  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare roomId: ForeignKey<RoomModel["id"]>;
  declare factId: ForeignKey<FactModel["id"]>;
  declare voterId: ForeignKey<PlayerModel["id"]>;
  declare selectedPlayerId: ForeignKey<PlayerModel["id"]>;

  declare getRoom: BelongsToGetAssociationMixin<RoomModel>;

  static async createWithValidation(
    voteData: Pick<
      InferCreationAttributes<VoteModel>,
      | "voterId"
      | "isCorrect"
      | "round"
      | "factId"
      | "roomId"
      | "selectedPlayerId"
    >,
  ) {
    try {
      return await VoteModel.create(voteData);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new KnownError({
          enumCode: ERROR_CODES.ALREADY_VOTED_FOR_FACT_IN_CURRENT_ROUND,
        });
      }
      throw error;
    }
  }
}

VoteModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: TABLE_NAME,
    indexes: [
      {
        unique: true,
        fields: ["voterId", "roomId", "factId", "round"],
        name: "unique_vote_per_user_per_fact_per_round",
      },
    ],
    hooks: {
      afterCreate: async (vote) => {
        const room = await vote.getRoom();
        const players = await room.getPlayers();

        const allVotesForCurrentFactInCurrentRound = await VoteModel.findAll({
          where: {
            factId: vote.factId,
            round: vote.round,
            roomId: vote.roomId,
          },
        });

        const isAllPlayersVotedForFact =
          allVotesForCurrentFactInCurrentRound.length ===
          players.filter((p) => !p.isFake).length;

        const roomWithFullInfo = await room.getFullInfo();

        io.to(room.code).emit("voting", {
          logMsg: `Голос принят`,
          room: roomWithFullInfo,
        });

        if (isAllPlayersVotedForFact) {
          await GameService.saveFactVotingResult({
            roomId: room.id,
            factId: vote.factId,
          });
        }
      },
    },
  },
);
