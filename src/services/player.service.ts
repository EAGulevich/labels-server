import { BOT_NAME } from "@constants";
import { FactModel } from "@models/fact.model";
import { PlayerModel } from "@models/player.model";
import { RoomModel } from "@models/room.model";
import { VoteModel } from "@models/vote.model";
import { GameService } from "@services/game.service";
import { MAX_PLAYERS, MIN_PLAYERS } from "@shared/constants/validations";
import {
  AvatarToken,
  BOT_AVATAR_TOKEN,
  ERROR_CODES,
  FACT_STATUSES,
  FactClient,
  PlayerClient,
  ROOM_STATUSES,
  RoomClient,
} from "@shared/types";
import { fakeId } from "@utils/fakeId";
import { getRandomElement } from "@utils/getRandomElement";
import { KnownError } from "@utils/KnownError";
import { Op } from "sequelize";

export class PlayerService {
  static async disconnectPlayer({
    playerId,
  }: {
    playerId: PlayerModel["id"];
  }): Promise<void> {
    const player = await PlayerModel.findByPk(playerId, {
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });

    const roomEntity = await player.getRoom();

    if (roomEntity.status === ROOM_STATUSES.LOBBY) {
      await this.deletePlayerById({ playerId: player.id });
    } else {
      await this.updateActivityPlayer({
        playerId,
        isActive: false,
      });
    }
  }

  static async updateActivityPlayer({
    playerId,
    isActive,
  }: {
    playerId: PlayerModel["id"];
    isActive: PlayerModel["isActive"];
  }): Promise<void> {
    const player = await PlayerModel.findByPk(playerId, {
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });

    await player.update({
      isActive,
      isVip: false,
    });

    await GameService.updateVipPlayer({
      roomId: player.roomId,
    });
  }

  static async deletePlayerById({
    playerId,
  }: {
    playerId: PlayerModel["id"];
  }): Promise<void> {
    const player = await PlayerModel.findByPk(playerId, {
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });
    const roomId = player.roomId;
    const isPlayerWasVip = player.isVip;

    try {
      await player.destroy();

      if (isPlayerWasVip) {
        await GameService.updateVipPlayer({
          roomId,
        });
      }
    } catch (error) {
      console.error("Error deleting player:", error);
      throw new Error("Failed to delete player");
    }
  }

  static async joinRoom({
    roomCode,
    player,
  }: {
    roomCode: RoomModel["code"];
    player: Pick<PlayerClient, "name" | "id">;
  }): Promise<{
    room: RoomClient;
    joinedPlayer: Pick<PlayerClient, "name" | "id">;
  }> {
    const room = await RoomModel.findOne({
      where: { code: roomCode },
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    if (player.name === BOT_NAME) {
      throw new KnownError({
        enumCode: ERROR_CODES.PLAYER_NAME_ALREADY_EXISTS,
      });
    }

    const existingPlayer = await PlayerModel.findOne({
      where: { id: player.id },
    });

    if (existingPlayer) {
      await this.updateActivityPlayer({
        playerId: player.id,
        isActive: true,
      });

      return {
        room: await room.getFullInfo(),
        joinedPlayer: {
          id: existingPlayer.id,
          name: existingPlayer.name,
        },
      };
    }

    const { newPlayer } = await this.addPlayerToRoom({
      id: player.id,
      roomId: room.id,
      playerName: player.name,
      isFake: false,
    });

    return {
      room: await room.getFullInfo(),
      joinedPlayer: {
        id: newPlayer.id,
        name: newPlayer.name,
      },
    };
  }

  static async addPlayerToRoom({
    id,
    roomId,
    playerName,
    isFake,
  }: {
    roomId: RoomModel["id"];
    id: PlayerModel["id"];
    playerName: PlayerModel["name"];
    isFake: PlayerModel["isFake"];
  }): Promise<{ newPlayer: Pick<PlayerClient, "id" | "name"> }> {
    const room = await RoomModel.findByPk(roomId, {
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.ROOM_NOT_FOUND,
      }),
    });

    const players = await room.getPlayers();

    if (players.length === MAX_PLAYERS) {
      throw new KnownError({ enumCode: ERROR_CODES.ROOM_AT_MAX_CAPACITY });
    } else if (room.status !== ROOM_STATUSES.LOBBY) {
      throw new KnownError({ enumCode: ERROR_CODES.GAME_ALREADY_STARTED });
    }

    const unusedAvatars = Object.values(AvatarToken).filter(
      (token) => !players.some((p) => p.avatarToken === token),
    );

    const newPlayer = await PlayerModel.createWithValidation({
      id,
      isFake,
      name: playerName,
      roomId: roomId,
      isVip: !isFake && !players.some((p) => p.isVip),
      isAvatarAutoSelected: true,
      avatarToken: isFake ? BOT_AVATAR_TOKEN : getRandomElement(unusedAvatars),
    });

    return {
      newPlayer: {
        id: newPlayer.id,
        name: newPlayer.name,
      },
    };
  }

  static async changePlayerAvatar({
    playerId,
    avatarToken,
  }: {
    playerId: PlayerModel["id"];
    avatarToken: PlayerModel["avatarToken"];
  }): Promise<{
    room: RoomClient;
    newAvatarToken: PlayerClient["avatar"]["token"];
  }> {
    const player = await PlayerModel.findOne({
      where: { id: playerId },
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });

    const playerWithSameAvatar = await PlayerModel.findOne({
      where: {
        roomId: player.roomId,
        avatarToken,
        id: { [Op.ne]: playerId },
      },
    });

    if (playerWithSameAvatar) {
      throw new KnownError({ enumCode: ERROR_CODES.AVATAR_ALREADY_TAKEN });
    }

    await player.update({
      avatarToken,
      isAvatarAutoSelected: false,
    });

    const room = await player.getRoom();

    return {
      room: await room.getFullInfo(),
      newAvatarToken: player.avatarToken,
    };
  }

  static async startGame({ playerId }: { playerId: string }): Promise<void> {
    const player = await PlayerModel.findOne({
      where: { id: playerId },
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });

    const room = await player.getRoom();
    const players = await room.getPlayers();

    if (players.length < MIN_PLAYERS) {
      throw new KnownError({ enumCode: ERROR_CODES.NOT_ENOUGH_PLAYERS });
    }

    await PlayerService.addPlayerToRoom({
      id: fakeId(room.code),
      roomId: room.id,
      playerName: BOT_NAME,
      isFake: true,
    });

    await room.update({
      status: ROOM_STATUSES.SUBMITTING_FACTS,
    });
  }

  static async addFact({
    factText,
    playerId,
  }: {
    factText: FactClient["text"];
    playerId: PlayerClient["id"];
  }): Promise<void> {
    const player = await PlayerModel.findOne({
      where: { id: playerId },
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });

    const room = await player.getRoom();

    if (player.factStatus !== FACT_STATUSES.NOT_RECEIVED) {
      throw new KnownError({
        enumCode: ERROR_CODES.PLAYER_ALREADY_SUBMITTED_FACT,
      });
    }

    await FactModel.createWithValidation({
      text: factText,
      roomId: room.id,
      authorId: playerId,
      selectedPlayerId: null,
    });
  }

  static async showResults({
    playerId,
  }: {
    playerId: PlayerModel["id"];
  }): Promise<void> {
    const player = await PlayerModel.findByPk(playerId, {
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.PLAYER_NOT_FOUND }),
    });

    const room = await player.getRoom();

    const someUnguessedPlayer = await PlayerModel.findOne({
      where: { roomId: room.id, factStatus: FACT_STATUSES.NOT_GUESSED },
    });

    if (someUnguessedPlayer) {
      throw new KnownError({
        enumCode: ERROR_CODES.GAME_RESULTS_NOT_FOUND,
      });
    }

    await room.update({ status: ROOM_STATUSES.RESULTS });
  }

  static async addVote({
    factId,
    voterId,
    selectedPlayerId,
  }: {
    factId: FactModel["id"];
    voterId: PlayerModel["id"];
    selectedPlayerId: PlayerModel["id"];
  }): Promise<{
    room: RoomClient;
  }> {
    const selectedPlayer = await PlayerModel.findByPk(selectedPlayerId, {
      rejectOnEmpty: new KnownError({
        enumCode: ERROR_CODES.PLAYER_NOT_FOUND,
        msg: `Не найден игрок с id=${selectedPlayerId}, за которого голосуют`,
      }),
    });

    const fact = await FactModel.findByPk(factId, {
      rejectOnEmpty: new KnownError({ enumCode: ERROR_CODES.FACT_NOT_FOUND }),
    });

    const room = await fact.getRoom();

    if (!room.currentVotingFactId) {
      throw new KnownError({ enumCode: ERROR_CODES.VOTING_PHASE_NOT_ACTIVE });
    }

    if (room.currentVotingFactId !== factId) {
      throw new KnownError({ enumCode: ERROR_CODES.WRONG_FACT_VOTING });
    }

    await VoteModel.createWithValidation({
      voterId,
      isCorrect: fact.authorId === selectedPlayerId,
      round: room.currentRound,
      factId: fact.id,
      roomId: room.id,
      selectedPlayerId: selectedPlayer.id,
    });

    return { room: await room.getFullInfo() };
  }
}
