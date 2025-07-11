import { AFTER_RECEIVING_ALL_VOTES_TIMEOUT_MS } from "@constants";
import { FactModel } from "@models/fact.model";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import { GameService } from "@services/game.service";
import { FACT_STATUSES } from "@shared/types";
import { sentryLogError } from "@utils/logger";
import {
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";

import { sequelize } from "./index";

const TABLE_NAME = "votingResults";

/** Результат голосования в конкретном раунде за конкретный факт */
export class VotingResultsModel extends Model<
  InferAttributes<VotingResultsModel>,
  InferCreationAttributes<VotingResultsModel>
> {
  declare round: number;

  declare id: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare roomId: ForeignKey<RoomModel["id"]>;
  declare factId: ForeignKey<FactModel["id"]>;
  declare selectedPlayerId: ForeignKey<PlayerModel["id"]> | null;

  declare getRoom: BelongsToGetAssociationMixin<RoomModel>;
}

VotingResultsModel.init(
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
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: TABLE_NAME,
    hooks: {
      afterCreate: async (votingResult) => {
        const room = await votingResult.getRoom();
        const notGuessedPlayersInPrevRounds = await PlayerModel.findAll({
          where: {
            factStatus: FACT_STATUSES.NOT_GUESSED,
          },
        });

        const votedFactsInCurrentRound = await VotingResultsModel.findAll({
          where: {
            roomId: votingResult.roomId,
            round: votingResult.round,
          },
        });

        const isAllFactsHasCandidate =
          notGuessedPlayersInPrevRounds.length ===
          votedFactsInCurrentRound.length;

        if (isAllFactsHasCandidate) {
          setTimeout(async () => {
            try {
              await GameService.startNewRound({
                roomCode: room.code,
              });
            } catch (err) {
              sentryLogError(err);
            }
          }, AFTER_RECEIVING_ALL_VOTES_TIMEOUT_MS);
        } else {
          setTimeout(async () => {
            try {
              await GameService.setNewFactForVoting({
                roomId: room.id,
              });
            } catch (err) {
              sentryLogError(err);
            }
          }, AFTER_RECEIVING_ALL_VOTES_TIMEOUT_MS);
        }
      },
    },
  },
);
