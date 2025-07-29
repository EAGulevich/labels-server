import { io } from "@app";
import { ADD_FAKE_FACT_TIMEOUT_MS } from "@constants";
import { FactModel } from "@models/fact.model";
import { PlayerModel } from "@models/player.model";
import { VoteModel } from "@models/vote.model";
import { VotingResultsModel } from "@models/votingResults.model";
import { mapToPlayerClient } from "@services/helpers";
import { PlayerService } from "@services/player.service";
import { ROOM_CODE_LENGTH } from "@shared/constants/validations";
import {
  ERROR_CODES,
  FACT_STATUSES,
  FactClient,
  Results,
  ROOM_STATUSES,
  RoomClient,
  VotingDataItem,
} from "@shared/types";
import { fakeId } from "@utils/fakeId";
import { getRandomElement } from "@utils/getRandomElement";
import { KnownError } from "@utils/KnownError";
import { sentryLogError } from "@utils/logger";
import { shuffleArray } from "@utils/shuffleArray";
import {
  BelongsToGetAssociationMixin,
  CreationOptional,
  DataTypes,
  ForeignKey,
  HasManyGetAssociationsMixin,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";

import { FAKE_FACTS } from "../FAKE_FACTS";
import { sequelize } from "./index";

const TABLE_NAME = "rooms";

export class RoomModel extends Model<
  InferAttributes<RoomModel>,
  InferCreationAttributes<RoomModel>
> {
  declare hostId: string;

  // TODO room_id: Может быть у комнаты не должно быть id, за это может отвечать код комнаты
  declare id: CreationOptional<number>;
  declare code: CreationOptional<string>;
  declare status: CreationOptional<ROOM_STATUSES>;
  declare isActive: CreationOptional<boolean>;
  declare currentRound: CreationOptional<number>;
  declare lang: "ru" | "en";

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare currentVotingFactId: ForeignKey<FactModel["id"]> | null;

  declare getPlayers: HasManyGetAssociationsMixin<PlayerModel>;
  declare getFacts: HasManyGetAssociationsMixin<FactModel>;
  declare getVotes: HasManyGetAssociationsMixin<VoteModel>;

  declare getCurrentVotingFact: BelongsToGetAssociationMixin<FactModel | null>;

  private static generateCode(): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  static async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      code = this.generateCode();
      const existingRoomEntity = await RoomModel.findOne({ where: { code } });
      if (!existingRoomEntity) {
        isUnique = true;
      }
    }

    return code!;
  }

  async getGameResults({
    roomId,
  }: {
    roomId: number;
  }): Promise<{ results: Results | null }> {
    const roomEntity = await RoomModel.findByPk(roomId, {
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.ROOM_NOT_FOUND }),
    });

    const roundResultsEntities = await VotingResultsModel.findAll({
      where: {
        roomId: roomEntity.id,
      },
      order: [["round", "ASC"]],
    });

    const groupedResultsPromise = roundResultsEntities.reduce<Promise<Results>>(
      async (accPromise, item) => {
        const acc = await accPromise;
        if (!acc[item.round]) {
          acc[item.round] = [];
        }

        const rightVotesEntities = await VoteModel.findAll({
          where: {
            roomId: roomEntity.id,
            round: item.round,
            factId: item.factId,
            isCorrect: true,
          },
        });

        const factEntity = await FactModel.findByPk(item.factId, {
          rejectOnEmpty: new KnownError({
            enumCode: ERROR_CODES.FACT_NOT_FOUND,
          }),
        });

        const authorOfFactEntity = await PlayerModel.findOne({
          where: {
            id: factEntity.authorId,
          },
          rejectOnEmpty: new KnownError({
            enumCode: ERROR_CODES.PLAYER_NOT_FOUND,
          }),
        });

        acc[item.round].push({
          fact: {
            id: factEntity.id,
            text: factEntity.text,
            author: {
              id: authorOfFactEntity.id,
              name: authorOfFactEntity.name,
              avatar: {
                token: authorOfFactEntity.avatarToken,
                isAutoSelected: authorOfFactEntity.isAvatarAutoSelected,
              },
            },
          },
          isGuessed: item.selectedPlayerId === factEntity?.authorId,
          playersWhoGuessedCorrectly: await Promise.all(
            rightVotesEntities.map(async (i) => {
              const rightGuessedPlayerEntity = await PlayerModel.findByPk(
                i.voterId,
                {
                  rejectOnEmpty: new KnownError({
                    enumCode: ERROR_CODES.PLAYER_NOT_FOUND,
                  }),
                },
              );

              return {
                id: rightGuessedPlayerEntity.id,
                avatar: {
                  token: rightGuessedPlayerEntity.avatarToken,
                  isAutoSelected: rightGuessedPlayerEntity.isAvatarAutoSelected,
                },
                name: rightGuessedPlayerEntity.name,
              };
            }),
          ),
        });
        return acc;
      },
      Promise.resolve({}),
    );

    const results = await Promise.resolve(groupedResultsPromise);

    return { results };
  }

  async getVotingData({ roomId }: { roomId: number }): Promise<{
    votingData: VotingDataItem | null;
  }> {
    const room = await RoomModel.findByPk(roomId, {
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    if (!room.currentVotingFactId) {
      return {
        votingData: null,
      };
    }

    const currentVotingFact = await room.getCurrentVotingFact();

    if (!currentVotingFact) {
      throw new KnownError({
        enumCode: ERROR_CODES.SERVER_ERROR,
        msg: "Голосование должно идти, но факта для голосования не найдено",
      });
    }

    const votesForCurrentVotingFact = await room.getVotes({
      where: {
        factId: currentVotingFact.id,
        round: room.currentRound,
      },
    });

    const currentRoundVotingResults = await VotingResultsModel.findAll({
      where: { roomId: room.id, round: room.currentRound },
      order: [["createdAt", "ASC"]],
    });

    const unguessedPlayersInPrevRounds = await PlayerModel.findAll({
      where: {
        roomId: room.id,
        factStatus: FACT_STATUSES.NOT_GUESSED,
      },
    });

    /** Кандидаты - игроки, которых не отгадали в прошлых раундах + в текущем раунде не были выбраны голосованием */
    const candidates: VotingDataItem["candidates"] =
      unguessedPlayersInPrevRounds
        .filter(
          (p) =>
            !currentRoundVotingResults.some(
              (result) => result.selectedPlayerId === p.id,
            ),
        )
        .sort((a, b) => a.order - b.order)
        .map((candidate) => ({
          candidate: {
            id: candidate.id,
            name: candidate.name,
            avatar: {
              token: candidate.avatarToken,
              isAutoSelected: candidate.isAvatarAutoSelected,
            },
          },
          votesCount: votesForCurrentVotingFact.filter(
            (item) => item.selectedPlayerId === candidate.id,
          ).length,
        }));

    const prevSteps = await Promise.all(
      currentRoundVotingResults.map(async (votingResult) => {
        const selectedPlayer = await PlayerModel.findOne({
          where: { id: votingResult.selectedPlayerId || "" },
        });
        const fact = await FactModel.findByPk(votingResult.factId, {
          rejectOnEmpty: new KnownError({
            enumCode: ERROR_CODES.FACT_NOT_FOUND,
          }),
        });
        return {
          fact: {
            id: fact.id,
            text: fact.text,
          },

          selectedPlayer: selectedPlayer
            ? mapToPlayerClient(selectedPlayer)
            : null,
        };
      }),
    );
    return {
      votingData: {
        currentVotingFact: {
          id: currentVotingFact.id,
          text: currentVotingFact.text,
        },
        playersWhoVotedIds: votesForCurrentVotingFact.map(
          (vote) => vote.voterId,
        ),
        candidates,
        prevSteps,
      },
    };
  }

  async getFactsWithSelectedPlayer({
    roomId,
  }: {
    roomId: number;
  }): Promise<{ facts: FactClient[] }> {
    const room = await RoomModel.findByPk(roomId, {
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    const facts = await room.getFacts();

    const factsWithSelectedPlayers = await Promise.all(
      facts.map(async (fact): Promise<FactClient> => {
        const factInfo = {
          id: fact.id,
          text: fact.text,
          isCorrect: fact.selectedPlayerId === fact.authorId,
        };

        if (!fact.selectedPlayerId) {
          return {
            ...factInfo,
            selectedPlayer: null,
          };
        }
        const selectedPlayer = await PlayerModel.findByPk(
          fact.selectedPlayerId,
          {
            rejectOnEmpty: new KnownError({
              enumCode: ERROR_CODES.PLAYER_NOT_FOUND,
              msg: `Выбранный голосованием игрок не найден для факта [id=${fact.id}]: [${fact.text}]`,
            }),
          },
        );

        return {
          ...factInfo,
          selectedPlayer: {
            id: selectedPlayer.id,
            name: selectedPlayer.name,
            avatar: {
              token: selectedPlayer.avatarToken,
              isAutoSelected: selectedPlayer.isAvatarAutoSelected,
            },
          },
        };
      }),
    );

    return { facts: factsWithSelectedPlayers };
  }

  async getFullInfo(): Promise<RoomClient> {
    const room = await RoomModel.findByPk(this.id, {
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    const { facts } = await this.getFactsWithSelectedPlayer({
      roomId: room.id,
    });
    const players = await room.getPlayers();

    const commonInfo: Pick<
      RoomClient,
      "code" | "isActive" | "currentRound" | "facts" | "players" | "hostId"
    > = {
      code: room.code,
      isActive: room.isActive,
      currentRound: room.currentRound,
      facts: facts,
      players: players.map(mapToPlayerClient),
      hostId: room.hostId,
    };

    if (room.status === ROOM_STATUSES.RESULTS) {
      const { results } = await this.getGameResults({ roomId: room.id });
      if (!results) {
        throw new KnownError({ enumCode: ERROR_CODES.GAME_RESULTS_NOT_FOUND });
      }
      return {
        ...commonInfo,
        status: room.status,
        votingData: null,
        results,
      };
    } else if (room.currentVotingFactId) {
      const { votingData } = await this.getVotingData({ roomId: room.id });
      if (!votingData) {
        throw new KnownError({ enumCode: ERROR_CODES.VOTING_DATA_NOT_FOUND });
      }
      return {
        ...commonInfo,
        status: room.status,
        votingData,
        results: null,
      };
    }

    return {
      ...commonInfo,
      status: room.status,
      results: null,
      votingData: null,
    };
  }
}

RoomModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(ROOM_CODE_LENGTH),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ROOM_STATUSES)),
      defaultValue: ROOM_STATUSES.LOBBY,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    currentRound: {
      type: DataTypes.NUMBER,
      defaultValue: 0,
    },
    lang: {
      type: DataTypes.ENUM("ru", "en"),
    },
    hostId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: TABLE_NAME,
    hooks: {
      beforeValidate: async (room) => {
        if (!room.code) {
          room.code = await RoomModel.generateUniqueCode();
        }
      },
      afterUpdate: async (room) => {
        const isHostLeft =
          room.previous("isActive") === true && room.get("isActive") === false;

        const isHostReturned =
          room.previous("isActive") === false && room.get("isActive") === true;

        const isStartNewVoting =
          !!room.get("currentVotingFactId") &&
          room.previous("currentVotingFactId") !==
            room.get("currentVotingFactId");

        const isGameStarted =
          room.previous("status") !== ROOM_STATUSES.SUBMITTING_FACTS &&
          room.get("status") === ROOM_STATUSES.SUBMITTING_FACTS;

        const isNewRoundStarted =
          (room.previous("currentRound") || 0) < room.get("currentRound");

        const isGameOver =
          room.previous("status") !== ROOM_STATUSES.RESULTS &&
          room.get("status") === ROOM_STATUSES.RESULTS;

        if (isHostLeft) {
          const roomWithFullInfo = await room.getFullInfo();

          io.sockets.in(room.code).emit("hostLeftRoom", {
            logMsg: "Хост потерял соединение",
            room: roomWithFullInfo,
          });
        }

        if (isHostReturned) {
          const roomWithFullInfo = await room.getFullInfo();
          io.sockets.in(room.code).emit("hostReturnedToRoom", {
            logMsg: "Хост восстановил соединение",
            room: roomWithFullInfo,
          });
        }

        if (isStartNewVoting) {
          const roomWithFullInfo = await room.getFullInfo();
          io.sockets.in(room.code).emit("voting", {
            logMsg: "Назначен новый факт для голосования",
            room: roomWithFullInfo,
          });
        }

        if (isGameOver) {
          const roomWithFullInfo = await room.getFullInfo();
          io.sockets.in(room.code).emit("results", {
            logMsg: "Отданы результаты игры",
            room: roomWithFullInfo,
          });
        }

        if (isGameStarted) {
          const roomWithFullInfo = await room.getFullInfo();
          io.sockets.in(room.code).emit("gameStarted", {
            logMsg: "Игра началась",
            room: roomWithFullInfo,
          });

          setTimeout(async () => {
            try {
              const randomFactText = getRandomElement(FAKE_FACTS);

              await PlayerService.addFact({
                factText: randomFactText[room.lang],
                playerId: fakeId(room.code),
              });
            } catch (err) {
              sentryLogError(err);
            }
          }, ADD_FAKE_FACT_TIMEOUT_MS);
        }

        if (isNewRoundStarted) {
          if (room.previous("currentRound") === 0) {
            // Перед началом 1 раунда фактам присваивается рандомный порядок
            const facts = await room.getFacts();
            await Promise.all(
              shuffleArray(facts).map((f, index) => {
                return f.update({ order: index + 1 });
              }),
            );
          } else {
            // После каждого раунда игрокам приваивается статус, были ли они отгаданы
            // а фактам выбранные голосованием игроки
            const votingResults = await VotingResultsModel.findAll({
              where: {
                roomId: room.id,
                round: room.currentRound - 1,
              },
            });

            await Promise.all(
              votingResults.map(async (result) => {
                const factForUpdate = await FactModel.findByPk(result.factId, {
                  rejectOnEmpty: new KnownError({
                    enumCode: ERROR_CODES.FACT_NOT_FOUND,
                    msg: `Не удалось найти факт, чтобы изменить у него выбранного голосованием игрока `,
                  }),
                });

                await factForUpdate.update({
                  selectedPlayerId: result.selectedPlayerId,
                });

                if (factForUpdate.authorId === factForUpdate.selectedPlayerId) {
                  const playerForUpdate = await factForUpdate.getAuthor();
                  await playerForUpdate.update({
                    factStatus: FACT_STATUSES.GUESSED,
                  });
                }
              }),
            );
          }

          const roomWithFullInfo = await room.getFullInfo();
          io.sockets.in(room.code).emit("newRoundStarted", {
            logMsg: "Начат новый раунд",
            room: roomWithFullInfo,
          });
        }
      },
    },
  },
);
