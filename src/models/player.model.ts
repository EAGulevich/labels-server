import { io } from "@app";
import { RoomModel } from "@models/room.model";
import { mapToPlayerClient } from "@services/helpers";
import {
  PLAYER_NAME_MAX_LENGTH,
  PLAYER_NAME_MIN_LENGTH,
} from "@shared/constants/validations";
import {
  AvatarToken,
  BotAvatarToken,
  ERROR_CODES,
  FACT_STATUSES,
} from "@shared/types";
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

const AVATAR_TOKENS: (BotAvatarToken | AvatarToken)[] = [
  "ROBOT_BOT",
  ...Object.values({
    ...AvatarToken,
  }),
];

const TABLE_NAME = "players";

export class PlayerModel extends Model<
  InferAttributes<PlayerModel>,
  InferCreationAttributes<PlayerModel>
> {
  declare id: string;
  declare name: string;
  declare isVip: boolean;
  declare isFake: boolean;
  declare avatarToken: AvatarToken | BotAvatarToken;
  declare isAvatarAutoSelected: boolean;

  // TODO players_order: придумать другой способ шафлить игроков в голосовании
  declare order: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>;
  declare factStatus: CreationOptional<FACT_STATUSES>;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare roomId: ForeignKey<RoomModel["id"]>;

  declare getRoom: BelongsToGetAssociationMixin<RoomModel>;

  static async createWithValidation(
    playerData: Pick<
      InferCreationAttributes<PlayerModel>,
      | "id"
      | "isFake"
      | "name"
      | "roomId"
      | "isVip"
      | "isAvatarAutoSelected"
      | "avatarToken"
    >,
  ) {
    if (playerData.name.length < PLAYER_NAME_MIN_LENGTH) {
      throw new KnownError({ enumCode: ERROR_CODES.PLAYER_NAME_TOO_SHORT });
    } else if (playerData.name.length > PLAYER_NAME_MAX_LENGTH) {
      throw new KnownError({ enumCode: ERROR_CODES.PLAYER_NAME_TOO_LONG });
    }

    try {
      return await PlayerModel.create(playerData);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new KnownError({
          enumCode: ERROR_CODES.PLAYER_NAME_ALREADY_EXISTS,
        });
      }
      throw error;
    }
  }
}

PlayerModel.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(PLAYER_NAME_MAX_LENGTH),
      allowNull: false,
      validate: {
        len: {
          args: [PLAYER_NAME_MIN_LENGTH, PLAYER_NAME_MAX_LENGTH],
          msg: `Имя игрока должно содержать от ${PLAYER_NAME_MIN_LENGTH} до ${PLAYER_NAME_MAX_LENGTH} символов`,
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVip: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    isFake: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    factStatus: {
      type: DataTypes.ENUM(...Object.values(FACT_STATUSES)),
      defaultValue: FACT_STATUSES.NOT_RECEIVED,
    },
    avatarToken: {
      type: DataTypes.ENUM(...AVATAR_TOKENS),
      allowNull: false,
    },
    isAvatarAutoSelected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
        fields: ["name", "roomId"],
        name: "unique_player_name_per_room",
      },
    ],
    hooks: {
      beforeValidate: (player: PlayerModel) => {
        if (player.name) {
          player.name = player.name.trim();
        }
      },
      afterCreate: async (player) => {
        const roomModel = await player.getRoom();
        const room = await roomModel.getFullInfo();
        const joinedPlayer = mapToPlayerClient(player);

        io.sockets.in(room.code).emit("joinedPlayer", {
          room,
          extra: { joinedPlayer },
          logMsg: `Игрок [${joinedPlayer.name}] присоединился к комнате`,
        });
      },
      afterDestroy: async (player) => {
        const roomModel = await player.getRoom();
        const room = await roomModel.getFullInfo();
        const disconnectedPlayerName = player.name;

        io.sockets.in(room.code).emit("disconnectedPlayer", {
          room,
          extra: { disconnectedPlayerName },
          logMsg: `Игрок [${disconnectedPlayerName}] вышел из комнаты`,
        });
      },
      afterUpdate: async (player) => {
        const isPlayerBecameVip =
          player.previous("isVip") === false && player.get("isVip") === true;

        const isPlayerBecameInactive =
          player.previous("isActive") === true &&
          player.get("isActive") === false;

        const isPlayerBecameActive =
          player.previous("isActive") === false &&
          player.get("isActive") === true;

        const isPlayerChangedAvatar =
          player.previous("avatarToken") !== player.get("avatarToken");

        if (isPlayerBecameVip) {
          const roomModel = await player.getRoom();
          const room = await roomModel.getFullInfo();

          io.sockets.in(room.code).emit("updateVipPlayer", {
            room,
            logMsg: `Игрок [${player}] стал VIP`,
            extra: {
              newVipPlayer: mapToPlayerClient(player),
            },
          });
        }

        if (isPlayerBecameInactive) {
          const roomModel = await player.getRoom();
          const room = await roomModel.getFullInfo();
          const markedInactivePlayer = mapToPlayerClient(player);

          io.sockets.in(room.code).emit("playerLostConnection", {
            logMsg: `Игрок [${markedInactivePlayer.name}] потерял соединение`,
            room,
            extra: { markedInactivePlayer },
          });
        }

        if (isPlayerBecameActive) {
          const roomModel = await player.getRoom();
          const room = await roomModel.getFullInfo();
          const reconnectedPlayer = mapToPlayerClient(player);

          io.sockets.in(room.code).emit("playerHasReconnected", {
            logMsg: `Игрок [${reconnectedPlayer.name}] восстановил соединение`,
            room,
            extra: { reconnectedPlayer },
          });
        }

        if (isPlayerChangedAvatar) {
          const roomModel = await player.getRoom();
          const room = await roomModel.getFullInfo();
          const updatedPlayer = mapToPlayerClient(player);

          io.sockets.in(room.code).emit("playerChangedAvatar", {
            logMsg: `Игрок [${updatedPlayer.name}] изменил аватар`,
            room,
            extra: { updatedPlayer },
          });
        }
      },
    },
  },
);
