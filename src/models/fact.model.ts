import { io } from "@app";
import { AFTER_RECEIVING_ALL_FACTS_TIMEOUT_MS } from "@constants";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import { GameService } from "@services/game.service";
import { mapToPlayerClient } from "@services/helpers";
import {
  FACT_TEXT_MAX_LENGTH,
  FACT_TEXT_MIN_LENGTH,
} from "@shared/constants/validations";
import { ERROR_CODES, FACT_STATUSES } from "@shared/types";
import { KnownError } from "@utils/KnownError";
import { sentryLog, sentryLogError } from "@utils/logger";
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

const TABLE_NAME = "facts";

export class FactModel extends Model<
  InferAttributes<FactModel>,
  InferCreationAttributes<FactModel>
> {
  declare text: string;

  declare id: CreationOptional<number>;
  declare order: CreationOptional<number>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare roomId: ForeignKey<RoomModel["id"]>;
  declare authorId: ForeignKey<PlayerModel["id"]>;
  declare selectedPlayerId: ForeignKey<PlayerModel["id"]> | null;

  declare getRoom: BelongsToGetAssociationMixin<RoomModel>;
  declare getAuthor: BelongsToGetAssociationMixin<PlayerModel>;

  static async createWithValidation(
    factData: Pick<
      InferCreationAttributes<FactModel>,
      "text" | "roomId" | "authorId" | "selectedPlayerId"
    >,
  ) {
    if (factData.text.length < FACT_TEXT_MIN_LENGTH) {
      throw new KnownError({ enumCode: ERROR_CODES.FACT_TEXT_TOO_SHORT });
    } else if (factData.text.length > FACT_TEXT_MAX_LENGTH) {
      throw new KnownError({ enumCode: ERROR_CODES.FACT_TEXT_TOO_LONG });
    }

    try {
      return await FactModel.create(factData);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new KnownError({ enumCode: ERROR_CODES.DUPLICATE_FACT });
      }
      throw error;
    }
  }
}

FactModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    text: {
      type: DataTypes.STRING(FACT_TEXT_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: {
          args: [FACT_TEXT_MIN_LENGTH, FACT_TEXT_MAX_LENGTH],
          msg: `Текст факта должен содержать от ${FACT_TEXT_MIN_LENGTH} до ${FACT_TEXT_MAX_LENGTH} символов`,
        },
      },
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
        fields: ["text", "roomId"],
        name: "unique_fact_text_per_room",
      },
    ],
    hooks: {
      beforeValidate: (fact) => {
        if (fact.text) {
          const str = fact.text.trim();
          fact.text = str.charAt(0).toUpperCase() + str.slice(1);
        }

        if (!fact.selectedPlayerId) {
          fact.selectedPlayerId = null;
        }
      },
      afterCreate: async (fact: FactModel) => {
        try {
          const room = await fact.getRoom();
          const fromPlayer = await fact.getAuthor();

          await fromPlayer.update({
            factStatus: FACT_STATUSES.NOT_GUESSED,
          });

          const roomWithAddedFact = await room.getFullInfo();

          io.sockets.in(room.code).emit("playerAddedFact", {
            room: roomWithAddedFact,
            extra: {
              fromPlayer: mapToPlayerClient(fromPlayer),
            },
          });
          sentryLog({
            severity: "info",
            eventFrom: "server",
            actionName: "playerAddedFact",
            message: `Игроком [${fromPlayer.name}] добавлен факт [${fact.text}]`,
            outputRoom: roomWithAddedFact,
          });

          const isAllFactsReceived =
            roomWithAddedFact.facts.length === roomWithAddedFact.players.length;

          if (isAllFactsReceived) {
            setTimeout(async () => {
              try {
                await GameService.startNewRound({
                  roomCode: room.code,
                });
              } catch (err) {
                sentryLogError(err);
              }
            }, AFTER_RECEIVING_ALL_FACTS_TIMEOUT_MS);
          }
        } catch (err) {
          sentryLogError(err);
        }
      },
    },
  },
);
